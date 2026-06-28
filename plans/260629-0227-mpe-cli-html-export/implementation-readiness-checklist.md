# Implementation readiness checklist

Use this checklist before marking standalone project complete.

## Scope
- [ ] Project remains CLI-first
- [ ] No renderer rewrite introduced
- [ ] Same engine/CSS/template/asset pipeline reused where required for parity
- [ ] Public attribution to upstream added
- [ ] License obligations satisfied

## CLI contract
- [ ] Input markdown path supported
- [ ] `--out` output path supported
- [ ] temp output default supported when `--out` omitted
- [ ] `--offline` behavior defined and tested
- [ ] stdout/stderr contract documented
- [ ] exit codes documented and tested
- [ ] invalid input path behavior tested
- [ ] overwrite / collision behavior tested

## Config behavior
- [ ] config lookup path documented
- [ ] precedence documented: CLI flags vs config vs env
- [ ] unsupported inherited settings documented
- [ ] sample config included if config file exists

## Parity validation
- [ ] plain markdown sample
- [ ] headings/lists/table sample
- [ ] code fences + theme sample
- [ ] image sample
- [ ] TOC sample
- [ ] Mermaid or diagram sample
- [ ] KaTeX/MathJax sample
- [ ] custom CSS/head injection sample
- [ ] malformed markdown sample
- [ ] offline asset sample
- [ ] remote asset sample

## Platform validation
- [ ] Windows run tested
- [ ] macOS run tested or documented pending
- [ ] Linux run tested or documented pending
- [ ] bash quoting tested
- [ ] PowerShell quoting tested
- [ ] cmd quoting tested
- [ ] spaces/Unicode/backslashes in paths tested

## Packaging
- [ ] npm package install path works
- [ ] binary command name fixed
- [ ] package metadata credits upstream
- [ ] README install/usage examples work
- [ ] CI runs lint/build/tests
- [ ] release strategy documented
- [ ] binary distribution marked optional unless shipped

## Cleanup and failure behavior
- [ ] temp-file cleanup behavior defined
- [ ] partial output cleanup behavior defined
- [ ] non-zero exits on export failure
- [ ] errors are human-readable

## Docs
- [ ] README has quick start
- [ ] README has examples
- [ ] README has troubleshooting
- [ ] README has compatibility/support table
- [ ] README has attribution section
- [ ] CHANGELOG/release notes mention upstream credit

## Optional wrapper
- [ ] Zed wrapper clearly marked out-of-scope, follow-up, or launcher-only

## Done
- [ ] Public user can install, run one command, get HTML output, and understand limits without reading source
