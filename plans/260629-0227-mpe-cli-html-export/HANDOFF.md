# Handoff guide

Use this folder as portable planning package for a fresh standalone repo.

## Goal
Build a public standalone CLI project that exports Markdown to HTML using the same rendering stack and styling behavior as the original Markdown Preview Enhanced export path, without rewriting the renderer.

## Source of truth
- Parent plan: `./plan.md`
- Phases: `./phase-01-discovery-scope.md`, `./phase-02-cli-export-core.md`, `./phase-03-packaging-validation-wrapper.md`
- Readiness checklist: `./implementation-readiness-checklist.md`
- Acceptance matrix: `./acceptance-test-matrix.md`
- Repo blueprint: `./standalone-repo-blueprint.md`
- Cook prompt: `./cook-handoff-prompt.md`
- Packed source reference: `./context/relevant-source-bundle.md`
- Packed test reference: `./context/relevant-test-bundle.md`
- Raw copied source snapshot: `./context/source-snapshot/`
- Raw copied test snapshot: `./context/test-snapshot/`

## What new repo should contain by end
- installable CLI package
- documented command interface
- reusable export service
- tests for representative export parity cases
- license/attribution docs to upstream
- optional binary release path documented
- optional Zed launcher deferred or shipped as thin wrapper only

## Recommended repo identity
- GitHub repo: `mpe-html-export-cli`
- npm package: `mpe-html-export-cli` or scoped equivalent
- binary command: `mpe-html`

## Hard constraints
- Do not rewrite markdown renderer.
- Reuse engine / CSS / template / asset pipeline.
- Keep public credit to upstream repo and preserve license obligations.
- Keep implementation cross-platform.
- Keep CLI packaging from forcing VS Code extension concerns into repo unless strictly needed.

## Recommended execution in fresh repo
1. Read `plan.md`.
2. Read all `phase-*.md` files.
3. Read `context/relevant-source-bundle.md`.
4. Create initial project skeleton.
5. Implement phase 01 decisions first, then phase 02 core, then phase 03 packaging/validation.
6. Do not skip parity tests or attribution work.

## Minimum deliverables for first complete release
- `mpe-html <input.md>` works
- `--out` works
- temp output default works
- `--offline` works
- output style matches upstream export closely on sample suite
- README install/usage/troubleshooting exists
- LICENSE and attribution note exist
- CI runs tests

## Non-goals for v1
- full VS Code preview UI clone
- custom Zed preview panel
- multi-file batch export unless trivial after core is stable
- renderer fork

## Final implementation check
Use `./implementation-readiness-checklist.md` before calling project done.
