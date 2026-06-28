import { access } from 'node:fs/promises';
import { resolve } from 'node:path';
import { CliError } from '../utils/errors';

export async function resolveInputPath(input: string) {
  const fullPath = resolve(input);
  try {
    await access(fullPath);
  } catch {
    throw new CliError(`Input file not found: ${input}`, 1);
  }
  return fullPath;
}
