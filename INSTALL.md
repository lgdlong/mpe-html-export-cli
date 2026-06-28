# INSTALL

## Requirements

- Node.js 20+
- npm

## Install dependencies

```bash
npm install
```

## Build CLI

```bash
npm run build
```

Build output goes to `dist/`.

## Run without global install

```bash
node dist/src/cli.js --help
node dist/src/cli.js ./README.md --out ./out/README.html
```

## Run with package script

```bash
npm run help
npm start -- ./README.md --out ./out/README.html
```

## Optional: link command globally for local development

```bash
npm link
mpe-html --help
mpe-html ./README.md --out ./out/README.html
```

## Useful flags

- `-o, --out <file>` set output HTML file
- `--offline` embed local assets and avoid remote fetches
- `--open` open generated file after export
- `--toc` generate table of contents
- `--force` overwrite existing output file

## Verify install

```bash
npm test
```

## Troubleshooting

### `node: command not found`

Install Node.js 20 or newer, then reopen terminal.

### `Cannot find module` or missing `dist/`

Run:

```bash
npm install
npm run build
```

### `mpe-html: command not found` after `npm link`

Open new terminal, or run command with full path first to confirm npm global bin is on `PATH`.
