import { readFile, writeFile } from 'node:fs/promises';
import {
  ensureParentDir,
  ensureWritableTarget,
  resolveOutputPath,
} from './fs/resolve-output-path';
import { cleanupOutput } from './fs/cleanup-output';
import { createRenderer } from './parity/export-options';
import { resolveConfig, type CliConfig } from './config/resolve-config';
import { resolveHomePath } from './config/resolve-config';
import { CliError } from './utils/errors';

export type ExportResult = {
  input: string;
  output: string;
};

export async function exportMarkdown(inputPath: string, cli: CliConfig): Promise<ExportResult> {
  const config = await resolveConfig(inputPath, cli);
  const input = await readFile(inputPath, 'utf8');
  const renderer = createRenderer({ offline: config.offline, toc: config.toc ?? false });
  const source = config.toc ? `[TOC]\n\n${input}` : input;
  const html = renderDocument(renderer.render(source), config);
  const target = resolveHomePath(
    config.output ?? (await resolveOutputPath(inputPath)),
  );

  await ensureWritableTarget(target, config.force ?? false);
  await ensureParentDir(target);

  try {
    await writeFile(target, html, 'utf8');
  } catch {
    await cleanupOutput(target);
    throw new CliError(`Failed to write output: ${target}`, 2);
  }

  return { input: inputPath, output: target };
}

function renderDocument(body: string, _config: CliConfig) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>mpe-html export</title>
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<style>
body{max-width:960px;margin:2rem auto;padding:0 1rem;font-family:system-ui,sans-serif;line-height:1.6}
pre{overflow:auto;padding:1rem;background:#f6f8fa;border-radius:6px}
code{font-family:ui-monospace,SFMono-Regular,monospace}
img{max-width:100%}
</style>
</head>
<body>
${body}
</body>
</html>`;
}
