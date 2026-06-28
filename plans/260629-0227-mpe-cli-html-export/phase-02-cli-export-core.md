# Phase 02 — CLI export core

## Context links
- Parent plan: `./plan.md`
- Phase dependency: `phase-01-discovery-scope.md`
- Code path: `src/extension-common.ts` → `src/preview-provider.ts` → engine export
- Repo config source: `package.json`, `src/config.ts`

## Overview
- Date: 2026-06-29
- Description: build reusable export core and CLI entrypoint on top of existing engine
- Priority: P2
- Implementation status: pending
- Review status: pending

## Key Insights
- Best reuse boundary is one helper that accepts source URI/path + export options + destination.
- CLI should delegate to same helper used by extension export commands.
- Shared helper should own config resolution, engine creation, and export result path.

## Requirements
- Parse CLI args for input file, output target, offline mode, and maybe open-after-export.
- Resolve workspace-relative and absolute paths consistently.
- Create temp HTML output when output path omitted.
- Return proper exit codes and stderr messages.
- Reuse current export pipeline and assets.
- Define config file UX: lookup locations, precedence, minimal sample config, and optional env var support.
- Define invalid-input behavior for missing files, directories passed as input, output collisions, partial writes, and whether stdout-only output is supported.
- Keep one shared `crossnote` dependency contract; no duplicate renderer copy in CLI package.

## Architecture
- New CLI entrypoint calls shared export service.
- Shared export service wraps current engine access path, not renderer internals.
- Keep CLI thin; keep markdown rendering logic in existing engine.
- Reuse extension-side export command by routing it through same service.

## Related code files
- `package.json`
- `src/preview-provider.ts`
- `src/extension-common.ts`
- `src/config.ts`
- likely new `src/export-service.ts`
- likely new `src/cli.ts` or `bin/mpe-cli.ts`

## Implementation Steps
1. Define a shared export service interface.
2. Move export-specific logic out of UI-bound methods into service.
3. Add CLI parser and command handler.
4. Support temp-file destination generation.
5. Define config lookup and precedence behavior.
6. Define exit-code table and stderr/stdout contract.
7. Preserve offline/CDN behavior from engine options.
8. Build parity matrix for custom CSS/head injection, Mermaid, KaTeX/MathJax, code themes, images, TOC, HTML5 embed, and remote vs offline asset resolution.
9. Make extension command call shared service instead of direct provider path if needed.

## Todo list
- [ ] Define export service API
- [ ] Wire CLI entrypoint
- [ ] Support temp output path
- [ ] Define config lookup and precedence
- [ ] Define exit codes and stderr/stdout behavior
- [ ] Preserve offline mode option
- [ ] Build style/asset parity checklist
- [ ] Reuse extension export path

## Success Criteria
- CLI can export HTML from terminal.
- Output uses same engine pipeline as extension export.
- Generated HTML matches current style baseline for target samples.

## Risk Assessment
- CLI packaging may conflict with current VS Code extension build setup.
- Engine may require context setup now hidden in provider class.
- Temp-file handling can leak files if cleanup not defined.

## Security Considerations
- Validate input path and output path.
- Avoid shelling out with unsanitized markdown content.
- Default to local asset embedding in offline mode if required for parity.

## Next steps
- After helper exists, add tests for known sample markdown inputs.
