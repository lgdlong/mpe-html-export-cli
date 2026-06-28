# mpe-html-export-cli

Standalone Markdown to HTML export CLI.

## Install

```bash
npm install
npm run build
```

## Run

```bash
node dist/cli.js ./docs/example.md --out ./out/example.html
```

## Flags

- `--out <file>` write output file
- `--offline` keep local output default
- `--toc` generate table of contents
- `--force` overwrite existing output

## Support

- Node 20+
- Windows, macOS, Linux

## Attribution

Derived from Markdown Preview Enhanced export flow and license terms.
