# Cook handoff prompt

Use this prompt when handing this plan to an implementation session.

```text
Implement this standalone public CLI project from the provided plan package.

Read in this order:
1. plan.md
2. HANDOFF.md
3. phase-01-discovery-scope.md
4. phase-02-cli-export-core.md
5. phase-03-packaging-validation-wrapper.md
6. implementation-readiness-checklist.md
7. acceptance-test-matrix.md
8. standalone-repo-blueprint.md
9. context/relevant-source-bundle.md
10. context/relevant-test-bundle.md

Goals:
- Build CLI-first standalone project
- Export Markdown to HTML
- Reuse same engine/CSS/template/asset pipeline behavior where needed for parity
- Do not rewrite markdown renderer
- Keep explicit attribution to upstream repo and satisfy license obligations
- Make project public-user ready

Must deliver:
- working CLI command
- package metadata
- README
- tests
- CI
- attribution/license docs
- parity validation fixtures

Must verify:
- temp output behavior
- `--out`
- `--offline`
- exit codes
- stderr/stdout behavior
- path handling on Windows-friendly inputs
- representative HTML parity fixtures

Non-goals:
- VS Code preview clone
- custom Zed preview UI
- renderer fork

Before calling work done, run through implementation-readiness-checklist.md and mark unresolved items clearly.
```
