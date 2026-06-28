import { rm } from 'node:fs/promises';

export async function cleanupOutput(filePath: string) {
  try {
    await rm(filePath, { force: true });
  } catch {
    return;
  }
}
