# Phase 01 — Discovery & scope

## Context links
- Parent plan: `./plan.md`
- Repo: `E:/Workspace/vscode-markdown-preview-enhanced`
- Key code path: `src/extension-common.ts:416` → `src/preview-provider.ts:923` → `engine.htmlExport({ offline })`
- Docs/research: existing `docs/html.md` behavior, Zed extension docs, repo package scripts

## Overview
- Date: 2026-06-29
- Description: lock scope, reuse boundary, and export parity target before code changes
- Priority: P2
- Implementation status: pending
- Review status: pending

## Key Insights
- Current HTML export is already routed through `PreviewProvider` and underlying engine.
- CLI should wrap existing export path, not reimplement markdown rendering.
- Style parity depends on reusing CSS, HTML shell, syntax-highlighting assets, math/diagram support, and asset embedding rules.
- Zed is secondary: if extension API cannot expose same preview UX, ship CLI first.
- Standalone public release needs explicit support matrix, config precedence, license/credit policy, and non-goals before implementation starts.
- CLI must stay version-locked to same `crossnote` contract as extension; no hidden renderer fork.

## Requirements
- Accept input markdown file path and optional output path.
- Export HTML to temp or user-specified destination.
- Support offline and CDN-hosted mode if engine already supports both.
- Preserve preview styling as close as current export output.
- Keep existing extension behavior intact.
- Define support matrix: OSes, Node version range, install paths, and v1 non-goals.
- Define config precedence: CLI flags vs config file vs inherited settings vs env vars, plus unsupported settings.
- Define path/FS behavior for Windows drive letters, backslashes, spaces, Unicode, symlinks, long paths, overwrite policy, and atomic writes.
- Define attribution policy for public release: upstream link, license inclusion, package metadata credit, README credit, and release note credit.

## Architecture
- Extract export-capable entrypoint from current engine path into a CLI-facing wrapper.
- Keep rendering pipeline inside current engine/crossnote stack.
- Add a thin command layer for arg parsing, path resolution, temp file naming, exit codes, and user messages.
- Prefer shared config resolution over duplicated CLI config.

## Related code files
- `package.json`
- `src/preview-provider.ts`
- `src/extension-common.ts`
- `src/config.ts`
- likely new CLI entrypoint file under `src/` or `bin/`
- likely shared export helper module under `src/` for reusable CLI + extension calls

## Implementation Steps
1. Map current export inputs/outputs and identify engine options needed for CLI parity.
2. Define CLI contract: args, defaults, temp output behavior, offline flag, exit codes.
3. Identify reusable export helper boundary so extension and CLI share one path.
4. List assets/config sources needed for exact style preservation.
5. Define support matrix, non-goals, and public-release attribution policy.
6. Define config precedence and unsupported settings list.
7. Define OS/path/file-system edge-case behavior.
8. Decide Zed wrapper scope: command launcher only, no custom preview UI for MVP.

## Todo list
- [ ] Confirm CLI UX and flags
- [ ] Confirm output path/temp-file behavior
- [ ] Confirm style-parity asset list
- [ ] Confirm support matrix and v1 non-goals
- [ ] Confirm config precedence and unsupported settings
- [ ] Confirm public attribution/license handling
- [ ] Confirm Windows/macOS/Linux path behavior
- [ ] Confirm Zed wrapper is post-MVP

## Success Criteria
- Clear CLI scope with no renderer rewrite.
- Reuse plan for engine/CSS/template/assets documented.
- No ambiguity about what remains in VS Code extension vs new CLI.

## Risk Assessment
- Engine may still hide VS Code-dependent assumptions.
- Style parity may break if some assets are loaded from extension/webview-only paths.
- Zed integration may be limited by extension API.

## Security Considerations
- Sanitize file paths and temp filenames.
- Avoid arbitrary command execution from markdown content.
- Keep remote asset loading explicit in offline mode.

## Next steps
- Move to phase 02 once CLI contract and reuse boundary are approved.
