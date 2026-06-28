# Phase 03 — Packaging, validation, wrapper

## Context links
- Parent plan: `./plan.md`
- Phase dependency: `phase-02-cli-export-core.md`
- Research context: Zed docs show limited extension surface for custom preview UI
- Repo packaging: `package.json`, build scripts, extension activation layout

## Overview
- Date: 2026-06-29
- Description: package CLI, validate parity, and define optional Zed wrapper shape
- Priority: P2
- Implementation status: pending
- Review status: pending

## Key Insights
- CLI value is highest when it is easy to install and run as one command.
- Zed integration should be minimal and command-driven, not a full preview panel clone.
- Validation must compare generated HTML against current export output on representative markdown samples.
- Public-release readiness needs one canonical install story, explicit support policy, and docs/troubleshooting beyond internal implementation notes.
- CLI packaging must not break current VS Code extension build targets, activation, or browser/native split.

## Requirements
- Add build/publish path for CLI binary or script.
- Document usage examples and temp-file output behavior.
- Validate style parity on real documents with math, code fences, images, TOC, and diagrams.
- If wrapper exists, make it a thin command launcher around CLI.
- Choose canonical distribution story: npm package first, binaries optional, with explicit naming and version mapping.
- Define support matrix for Windows/macOS/Linux and shell quoting behavior for bash, zsh, PowerShell, and cmd.
- Define cleanup behavior for temp files and partial outputs on failure.
- Define public docs set: README install/run examples, troubleshooting, compatibility table, attribution/license note, and migration note from extension-only usage.

## Architecture
- Package CLI via existing Node build chain or a small dedicated entrypoint.
- Keep VS Code extension as primary host for existing features.
- Optional Zed wrapper only calls CLI and opens exported HTML file.
- Validation harness compares output snapshots or hashes for representative inputs.

## Related code files
- `package.json`
- `build.js`
- `gulpfile.js`
- `README.md`
- `CHANGELOG.md`
- likely new docs under `plans/` for rollout notes if needed
- likely new tests under `test/`

## Implementation Steps
1. Choose canonical distribution path: npm CLI first, binaries optional.
2. Add packaging script/entry so CLI can be invoked from terminal after install.
3. Protect existing extension build targets and activation behavior while adding CLI packaging.
4. Document command usage and supported flags.
5. Add sample-based parity checks for export HTML.
6. Expand validation set to math, code fences, images, TOC, diagrams, malformed markdown, offline mode, custom CSS/head injection, and remote asset cases.
7. Verify offline output and asset embedding against expected baseline.
8. Validate install/run on Windows, macOS, Linux, plus quoting behavior across common shells.
9. Define temp-file cleanup and partial-output cleanup behavior.
10. Decide whether to ship Zed wrapper now or keep as follow-up; if yes, keep it launcher-only.

## Todo list
- [ ] Decide canonical distribution target
- [ ] Protect extension build/package boundary
- [ ] Add docs for CLI usage
- [ ] Add parity validation samples
- [ ] Validate shell quoting across platforms
- [ ] Define cleanup behavior for temp/partial outputs
- [ ] Add public attribution/license docs
- [ ] Decide Zed wrapper follow-up

## Success Criteria
- CLI install/run path is documented and stable.
- HTML export parity is verified on representative samples.
- Scope of Zed wrapper is explicitly limited.

## Risk Assessment
- Packaging may require extra scripts or config in existing build chain.
- Parity may regress when upstream engine changes.
- Zed wrapper may deliver less UX than VS Code and should not block CLI launch.

## Security Considerations
- Avoid unsafe auto-open behavior by default.
- Keep temp files in predictable but user-scoped locations.
- Do not enable script execution unless parity or explicit flag requires it.

## Next steps
- Promote to implementation only after phase 01/02 scope is approved.
