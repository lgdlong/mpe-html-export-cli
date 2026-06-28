#!/usr/bin/env node
import { Command } from 'commander';
import { exportMarkdown } from './export-service';
import { resolveInputPath } from './fs/resolve-input-path';
import { CliError } from './utils/errors';
import { writeStderr, writeStdout } from './utils/logger';

const program = new Command();

program
  .name('mpe-html')
  .argument('<input>', 'markdown file')
  .option('-o, --out <file>', 'output html file')
  .option('--offline', 'embed local assets and avoid remote fetches', true)
  .option('--open', 'open output after export')
  .option('--toc', 'generate table of contents')
  .option('--force', 'overwrite output file')
  .action(async (input: string, options: Record<string, boolean | string>) => {
    try {
      const inputPath = await resolveInputPath(input);
      const result = await exportMarkdown(inputPath, {
        input: inputPath,
        output: options.out as string | undefined,
        offline: Boolean(options.offline),
        open: Boolean(options.open),
        toc: Boolean(options.toc),
        force: Boolean(options.force),
      });
      writeStdout(result.output);
    } catch (error) {
      handleError(error);
      process.exitCode = error instanceof CliError ? error.exitCode : 3;
    }
  });

program.parseAsync().catch(handleError);

function handleError(error: unknown) {
  if (error instanceof CliError) {
    writeStderr(error.message);
    return;
  }
  writeStderr(error instanceof Error ? error.message : String(error));
}
