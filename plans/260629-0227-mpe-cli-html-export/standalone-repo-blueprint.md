# Standalone repo blueprint

Target: fresh public repo built from this plan package.

## Recommended top-level files
- `package.json`
- `README.md`
- `LICENSE`
- `.gitignore`
- `tsconfig.json`
- `src/`
- `test/`
- `.github/workflows/ci.yml`
- `examples/`
- `docs/attribution.md`
- `CHANGELOG.md`

## Recommended source layout
```text
src/
  cli.ts                     # arg parsing, command dispatch
  export-service.ts          # shared export entrypoint
  config/
    resolve-config.ts        # config lookup + precedence
    default-config.ts        # CLI defaults only
  fs/
    resolve-input-path.ts    # normalize input paths
    resolve-output-path.ts   # output path + temp path
    cleanup-output.ts        # temp/partial cleanup behavior
  parity/
    export-options.ts        # maps CLI options to engine options
  utils/
    errors.ts                # typed CLI errors + exit codes
    logger.ts                # stdout/stderr policy
test/
  cli.test.ts
  export-service.test.ts
  fixtures/
    basic.md
    tables.md
    code-theme.md
    images.md
    toc.md
    mermaid.md
    math.md
    custom-css.md
    malformed.md
```

## Recommended docs layout
```text
docs/
  attribution.md             # upstream credit + reuse boundary
  compatibility.md           # OS / shell / Node support matrix
  release.md                 # npm publish + optional binary release
```

## Package shape
- `bin.mpe-html` points to built CLI entrypoint
- package description mentions upstream origin honestly
- keywords target markdown/html/export/cli
- Node engine range declared explicitly

## Mandatory deliverables
- CLI command works from terminal
- one-command export to temp or explicit output
- parity tests run in CI
- public attribution visible without opening source files

## Design rules
- Keep CLI thin.
- Keep rendering delegated.
- Keep config predictable.
- Keep output failures recoverable.
- Keep repo public-user friendly.

## Anti-patterns
- Copy whole extension repo into new repo.
- Rebuild renderer from markdown-it plugins manually.
- Hide attribution in a deep docs file only.
- Add Zed integration before core CLI is stable.
