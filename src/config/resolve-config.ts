import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { defaultConfig, type ExportConfig } from './default-config';

export type CliConfig = ExportConfig & {
  input?: string;
  force?: boolean;
};

export async function resolveConfig(inputPath: string, cli: CliConfig) {
  const fileConfig = await readConfigFile(inputPath);
  const definedCli = Object.fromEntries(
    Object.entries(cli).filter(([, value]) => value !== undefined),
  ) as Partial<CliConfig>;

  return {
    ...defaultConfig,
    ...fileConfig,
    ...definedCli,
    input: definedCli.input ?? inputPath,
  } satisfies CliConfig;
}

async function readConfigFile(inputPath: string): Promise<Partial<ExportConfig>> {
  const candidates = [
    resolve(dirname(inputPath), 'mpe-html-export.config.json'),
    resolve(process.cwd(), 'mpe-html-export.config.json'),
  ];

  for (const candidate of candidates) {
    if (!existsSync(candidate)) {
      continue;
    }
    const text = await readFile(candidate, 'utf8');
    return JSON.parse(text) as Partial<ExportConfig>;
  }

  return {};
}

export function resolveHomePath(value: string) {
  if (!value.startsWith('~')) {
    return value;
  }
  return join(process.env.HOME ?? process.env.USERPROFILE ?? '', value.slice(1));
}
