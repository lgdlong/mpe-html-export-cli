export function writeStdout(message: string) {
  process.stdout.write(`${message}\n`);
}

export function writeStderr(message: string) {
  process.stderr.write(`${message}\n`);
}
