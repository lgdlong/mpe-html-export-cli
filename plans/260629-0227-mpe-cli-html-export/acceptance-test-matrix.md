# Acceptance test matrix

Use this matrix as final validation target for implementation in fresh standalone repo.

## Test policy
- Prefer real fixture files over synthetic string-only unit tests.
- Validate both CLI behavior and rendered-output parity.
- For parity, compare against upstream export behavior where possible.
- If exact byte-for-byte HTML is unrealistic, compare normalized invariants and rendered artifact presence.
- Every failure must say which fixture, which mode, and which invariant failed.

## Required command surface
Assumed commands:
- `mpe-html <input>`
- `mpe-html <input> --out <output>`
- `mpe-html <input> --offline`
- optional `mpe-html <input> --open`

Adjust names if final CLI differs, but preserve same behavior coverage.

## Exit code contract
- `0` success
- `1` user/input/config error
- `2` export/render failure
- `3` unexpected internal failure

If implementation chooses different numeric codes, document them and update all tests consistently.

## Fixture set
Create fixture files under `test/fixtures/`.

### F01 — basic markdown
**Input**
- headings
- paragraphs
- emphasis
- links
- blockquote

**Command**
- `mpe-html basic.md`
- `mpe-html basic.md --out out/basic.html`

**Checks**
- exit code `0`
- output file exists
- output file non-empty
- contains HTML shell
- contains rendered `<h1>` or equivalent heading output
- contains rendered link anchor
- output path printed to stdout or stderr per documented contract

### F02 — tables and lists
**Input**
- ordered list
- unordered list
- table

**Checks**
- table rendered as HTML table
- nested list structure preserved
- no CLI crash

### F03 — code fences and code theme
**Input**
- fenced code blocks in 2 languages
- inline code

**Checks**
- code block HTML exists
- syntax-highlight classes or themed wrapper exists
- selected code theme asset/reference appears
- offline mode does not drop code styling

### F04 — local image handling
**Input**
- markdown file with local PNG/JPG/SVG references

**Commands**
- `mpe-html images.md`
- `mpe-html images.md --offline`

**Checks**
- standard mode preserves image references correctly
- offline mode follows documented asset policy
- if embedding is expected, embedded data/rewritten paths exist
- broken local paths produce documented error or warning behavior, not silent corruption

### F05 — TOC behavior
**Input**
- headings with enough depth for TOC
- any syntax used by upstream export path for TOC generation

**Checks**
- TOC-related markup generated when expected
- heading anchors exist
- no duplicate anchor collisions on repeated headings

### F06 — math rendering
**Input**
- inline math
- block math
- both delimiter styles used by supported defaults

**Commands**
- run with default math setting
- run with alternate supported math config if implementation exposes config

**Checks**
- math output container exists
- expected math script/style references or rendered KaTeX/MathJax markup exists
- offline mode behavior matches documented contract

### F07 — Mermaid or diagrams
**Input**
- mermaid block
- optional other diagram syntax if inherited from upstream is intentionally supported

**Checks**
- diagram block is preserved and rendered according to supported mode
- export does not strip required script/style references
- failure mode for unsupported diagram engines is explicit

### F08 — custom CSS and head injection
**Input**
- fixture with custom CSS file and custom preview head content wired through supported config path

**Checks**
- custom CSS is present in output or referenced as documented
- custom head injection appears in output head section
- CLI config precedence chooses fixture config over defaults

### F09 — malformed markdown tolerance
**Input**
- unclosed fences
- broken table rows
- malformed HTML

**Checks**
- CLI does not crash unexpectedly
- output still generated if upstream tolerates it
- if export fails, exit code and error are documented and stable

### F10 — path edge cases
**Inputs**
- file path with spaces
- Unicode filename
- Windows-style path separator handling
- nested relative path

**Checks**
- path resolves correctly
- output file created in intended location
- quoting guidance in README actually works

### F11 — temp output default
**Command**
- `mpe-html basic.md`

**Checks**
- temp output file created in documented directory
- filename pattern matches docs
- command prints path clearly
- if cleanup is deferred, docs say so

### F12 — explicit output overwrite policy
**Commands**
- export to new output path
- export again to same output path

**Checks**
- behavior matches docs: overwrite, reject, or require force flag
- no partial/corrupt output left behind on failure

### F13 — invalid input handling
**Commands**
- missing file path
- directory path instead of file
- unsupported extension if restricted

**Checks**
- non-zero exit code
- human-readable error
- no output file created

### F14 — config precedence
**Setup**
- conflicting values across CLI flags, config file, maybe env vars

**Checks**
- precedence matches docs exactly
- unsupported settings ignored with clear behavior
- test asserts one visible outcome, not just no-crash

### F15 — stdout/stderr contract
**Checks**
- success messages appear in documented stream only
- errors appear in documented stream only
- machine-usable output path is not mixed with noisy logs if contract promises clean stdout

### F16 — public package smoke test
**Checks**
- install command works from clean environment
- binary command resolves
- `--help` works
- version command works if provided

## Platform matrix
Minimum validation targets:

| Area | Windows | macOS | Linux |
|---|---|---|---|
| Install | required | required or documented pending | required or documented pending |
| Basic export | required | required or documented pending | required or documented pending |
| Space/Unicode path | required | required | required |
| Shell quoting | PowerShell + cmd + bash | zsh/bash | bash |
| Temp output | required | required | required |

If macOS/Linux cannot be executed immediately, mark as pending with rationale. Do not silently claim coverage.

## README acceptance checks
README must include:
- install command
- first run example
- `--out` example
- `--offline` example
- path-with-spaces example
- support matrix
- attribution note
- troubleshooting for common failures

## CI acceptance checks
CI should run at least:
- build
- lint if present
- unit/integration tests
- fixture-based export tests

Optional later:
- matrix across OSes
- binary packaging verification

## Release acceptance checks
Before tagging first public release:
- upstream attribution visible in README
- license file present
- package metadata points to new repo
- changelog/release notes mention upstream origin
- npm package name and binary name finalized

## Done threshold
Project is only "done" when:
- all required fixtures pass or are explicitly waived with reason
- unresolved platform gaps are documented
- CLI usage is public-user understandable
- output parity is demonstrated on representative fixtures
- attribution/license work is complete

## Unresolved questions
- Whether exact HTML snapshot comparisons are stable enough across environments, or normalized structural assertions should be canonical.
- Whether binary releases are part of first release or deferred after npm CLI stabilizes.
