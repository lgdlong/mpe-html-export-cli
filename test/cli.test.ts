import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { strict as assert } from 'node:assert';
import { test, beforeEach, afterEach } from 'node:test';
import { spawn } from 'node:child_process';

const repoRoot = process.cwd();
const cli = join(repoRoot, 'dist', 'src', 'cli.js');
let tempDir = '';

beforeEach(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'mpe-html-test-'));
});

afterEach(async () => {
  if (tempDir) {
    await rm(tempDir, { recursive: true, force: true });
  }
});

async function runCli(args: string[]) {
  return await new Promise<{ code: number; stdout: string; stderr: string }>((resolve) => {
    const child = spawn(process.execPath, [cli, ...args], {
      cwd: repoRoot,
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({ code: code ?? 0, stdout, stderr });
    });
  });
}

test('exports markdown to html', async () => {
  const input = join(tempDir, 'basic.md');
  const output = join(tempDir, 'basic.html');
  await writeFile(input, '# Hello\n\nA [link](https://example.com).\n', 'utf8');

  const result = await runCli([input, '--out', output]);

  assert.equal(result.code, 0);
  assert.equal(result.stderr.trim(), '');
  assert.equal(result.stdout.trim(), output);
  const html = await readFile(output, 'utf8');
  assert.match(html, /<!doctype html>/i);
  assert.match(html, /Hello/);
  assert.match(html, /example\.com/);
});

test('creates temp output when --out omitted', async () => {
  const input = join(tempDir, 'temp.md');
  await writeFile(input, '# Temp\n', 'utf8');

  const result = await runCli([input]);

  assert.equal(result.code, 0);
  assert.ok(result.stdout.trim().endsWith('.html'));
  const html = await readFile(result.stdout.trim(), 'utf8');
  assert.match(html, /Temp/);
});

test('fails on missing input file', async () => {
  const result = await runCli([join(tempDir, 'missing.md')]);

  assert.equal(result.code, 1);
  assert.match(result.stderr, /Input file not found/);
});

test('respects config file in input dir', async () => {
  const inputDir = join(tempDir, 'project');
  await mkdir(inputDir, { recursive: true });
  const input = join(inputDir, 'config.md');
  const configFile = join(inputDir, 'mpe-html-export.config.json');
  const output = join(tempDir, 'config-out.html');
  await writeFile(input, '# Config\n', 'utf8');
  await writeFile(configFile, JSON.stringify({ output }), 'utf8');

  const result = await runCli([input]);

  assert.equal(result.code, 0);
  assert.equal(result.stdout.trim(), output);
  const html = await readFile(output, 'utf8');
  assert.match(html, /Config/);
});
