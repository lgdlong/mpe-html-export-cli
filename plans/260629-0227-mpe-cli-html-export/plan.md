---
title: "MPE CLI HTML export"
description: "Tách preview export thành CLI, reuse engine/CSS/template để HTML giống bản gốc"
status: pending
priority: P2
effort: 6h
branch: develop
tags: [cli, html-export, markdown, zed, preview]
created: 2026-06-29
---

# Plan

Goal: tách export HTML ra CLI chạy terminal, giữ style gần như y chang repo hiện tại bằng reuse engine/CSS/template/asset pipeline. Không rewrite markdown renderer.

## Phases

1. [Discovery & scope](./phase-01-discovery-scope.md) — pending, 0%
2. [CLI export core](./phase-02-cli-export-core.md) — pending, 0%
3. [Packaging, validation, wrapper](./phase-03-packaging-validation-wrapper.md) — pending, 0%

## Notes

- Source of truth: `PreviewProvider -> engine.htmlExport({ offline })`.
- Zed support treated as follow-up wrapper, not MVP.
- Preserve existing assets, themes, and export defaults first; add new behavior only where CLI needs it.
- Credit and attribution stay explicit: this project is derived from the original repo, with license notice, upstream link, and contributor credit kept in README, package metadata, and release notes.
- If code/assets are reused, preserve upstream copyright headers and license obligations.
- Portable handoff bundle added under `./context/` so this plan can move to a fresh repo without losing critical source references.
- `./context/source-snapshot/` contains copied key source files; `./context/relevant-source-bundle.md` contains repomix packed reference.
- `HANDOFF.md`, `implementation-readiness-checklist.md`, `standalone-repo-blueprint.md`, and `cook-handoff-prompt.md` are part of required portable package.
