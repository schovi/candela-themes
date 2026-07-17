# 004 — Extra editor formats: Zed, Sublime, Neovim, Helix

done: 2026-07-17
depends: 001

## What & why

Broaden reach beyond the big three: emit Aurora for Zed, Sublime Text, Neovim (base16), and
Helix, so the themes work "out of the box" across the common editor landscape. One cohesive
"extra formats" outcome — each emitter is small and shares the 001 scaffolding.

## Spec

Extend the 001 generator with four emitters, all reusing the existing color helpers and the
README syntax scope roles:
- **Zed** → `dist/zed/aurora.json` (or per-theme) — Zed theme family JSON: `style{}` with editor
  UI keys + `syntax{}` mapping token roles to Aurora syntax colors. `appearance: "light"`.
- **Sublime Text** → `dist/sublime/aurora-<id>.sublime-color-scheme` — JSON with `variables` +
  `globals` (background=`surface`, foreground=`ink`, caret=`cursor`, selection=`selection`) +
  `rules[]` mapping TextMate-style scopes (same scope table as VS Code) to colors.
- **Neovim** → `dist/nvim/` — base16-style palette (16 slots from the ANSI mapping) is the lazy
  path; verify whether a base16 YAML/theme file or a small Lua colorscheme is the better fit and
  pick one, noting the choice. Don't build both.
- **Helix** → `dist/helix/aurora-<id>.toml` — Helix theme TOML: `[palette]` + top-level scope keys
  (`keyword`, `string`, `function`, `constant.numeric`, `type`, `comment`, `ui.background`,
  `ui.cursor`, `ui.selection`, …) mapped to Aurora tokens.

Boundary:
- Production surface: emitters in `scripts/` (+ reuse `lib/`), output under `dist/{zed,sublime,nvim,helix}/`.
- Contract: reuse 001 scaffolding; do not duplicate color/ANSI logic.
- Docs: extend `docs/design-handover/README.md` (it already says "same idea works for Sublime,
  Neovim, Zed, Helix" — replace that with the real mappings/paths). Install instructions → task 006.
- Exclusions: no marketplace/registry publishing for any of these; no per-format packaging beyond
  the drop-in files.

## Acceptance criteria

- `node scripts/generate.js` also writes Zed, Sublime, Neovim, and Helix output for all 14 themes.
- Each format loads in its editor and applies background=`surface`-family, correct syntax colors
  per the README scope roles (spot-check at least one theme per editor where the editor is available;
  for any editor you can't run, verify the file against that editor's documented theme schema and
  say so).
- Neovim output uses one chosen approach (base16 vs Lua) with the choice noted in the README.
- Generator remains deterministic and no-deps.

## Notes

`depends: 001`. Lowest priority of the set — nice-to-have breadth after the daily drivers
(iTerm2/VS Code/IntelliJ) land. If any one editor's format turns out to need real per-editor
nuance, it's fine to split it out into its own follow-up rather than forcing it here.
