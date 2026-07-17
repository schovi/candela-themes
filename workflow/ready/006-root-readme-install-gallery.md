# 006 — Root README + install docs + screenshot gallery

priority: 40
depends: 001, 002, 003

## What & why

Make the repo presentable as a real theme distribution. Today there's only the
design-handover README; the repo root has none. This task writes the top-level `README.md`
that sells Aurora, lists the 14 themes, shows real screenshots, and gives per-tool install
instructions. Screenshots are captured from the existing `.dc.html` showcase via Chrome MCP —
they are the presentation centerpiece, embedded directly in the README.

## Spec

Write `README.md` at the repo root:
- **What/why**: the eye-strain-comfort pitch (condense from `docs/design-handover/README.md`,
  cross-link, don't duplicate the whole thing).
- **The 14 themes**: the table (name, tone, fonts) + a screenshot per theme, or a gallery grid.
- **Screenshots**: capture from `docs/design-handover/Aurora Light Themes.dc.html` using Chrome MCP
  (the showcase renders every theme across terminal/Ruby/Kotlin/Markdown). Save under
  `docs/screenshots/aurora-<id>.png` (or a gallery montage) and embed with relative paths.
  If Chrome MCP is unavailable at run time, leave clearly-marked `![](docs/screenshots/...)`
  placeholders and a one-line note on how to regenerate — don't block the whole task on it.
- **Install instructions per tool**, pointing at the generated `dist/` output:
  iTerm2 (import `.itermcolors`), VS Code (install the `dist/vscode` extension / vsix),
  IntelliJ (import `.icls` + enable UI theme), and a short "other tools" section for the terminal
  + extra editor formats. Verify the paths/steps against what 001/002/003 actually produced.
- **Contributing/extend**: one line linking to `AGENTS.md` and the design invariants.

Boundary:
- Production surface: root `README.md`, `docs/screenshots/` (new, committed images).
- Contract: reference real `dist/` paths from 001/002/003 — this is why it depends on them.
- Docs: cross-link `docs/design-handover/README.md`; follow `docs/style.md` (no duplication).
- Exclusions: extra editor formats (004) may not exist yet — mention them only if 004 has landed;
  otherwise scope install to the big three + terminals.

## Acceptance criteria

- Root `README.md` exists: pitch, 14-theme table, gallery, per-tool install for iTerm2 + VS Code +
  IntelliJ + terminals.
- Screenshots are real images captured from the showcase (embedded, relative paths under
  `docs/screenshots/`), or clearly-marked placeholders with regeneration instructions if Chrome MCP
  was unavailable — state which in the completion note.
- Install steps match the actual `dist/` output paths produced by 001/002/003 (verified, not guessed).
- Cross-links to `docs/design-handover/README.md` and `AGENTS.md`; no duplicated invariant text.

## Notes

`depends: 001, 002, 003` so install instructions describe real generated output. Screenshots
themselves only need the `.dc.html` showcase (already present), but the README as a whole is the
presentation layer over the shipped themes, so it lands after the daily drivers. Chrome MCP: open
the showcase file, capture per-theme frames. This is the task where the presentation comes together.
