import { mkdtemp, mkdir, stat } from 'node:fs/promises';
import { dirname, extname, join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { CliError } from '../utils/errors';

export async function resolveOutputPath(inputPath: string, output?: string) {
  if (output) {
    return resolve(output);
  }

  const dir = await mkdtemp(join(tmpdir(), 'mpe-html-'));
  const base = inputPath.replace(
    new RegExp(`${escapeRegExp(extname(inputPath))}$`),
    '',
  );
  return join(dir, `${base.split(/[/\\]/).pop() || 'output'}.html`);
}

export async function ensureParentDir(filePath: string) {
  await mkdir(dirname(filePath), { recursive: true });
}

export async function ensureWritableTarget(filePath: string, force = false) {
  try {
    await stat(filePath);
    if (!force) {
      throw new CliError(`Output exists: ${filePath}`, 1);
    }
  } catch (error) {
    if (error instanceof CliError) {
      throw error;
    }
  }
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
