# 031 — Multi-format theme exports: client-side zips with install manuals

done: 2026-07-19
depends: 030

## What & why

From the unified tool (task 030), export the current draft theme ready-to-use for any
supported tool: a zip per target (theme file(s) + a README with install steps for that
tool), plus a "full export" zip containing every format, the raw theme JSON, and a
master README. Built entirely client-side — no backend (user decision; the site is
static per D1/D3 and `scripts/generate.js` already knows all 12 formats).

## Spec

**Pure-emitter refactor.** `scripts/generate.js` mixes emitting (string-building) with
`fs` writes. Extract the per-theme emitters into a shared module under `lib/`
(importable by both Node CJS and the Vite app, following the existing
`lib/colors.js` / `lib/rules.js` pattern): terminal formats (iterm2, alacritty, kitty,
wezterm, windows-terminal, ghostty — need the top-level `ansiMapping`) and editor
formats (vscode, intellij, zed, sublime, nvim, helix). Each emitter takes a theme (+
ansiMapping where relevant) and returns `{ files: [{path, content}] }` — no fs.
`scripts/generate.js` becomes the fs shell that writes them into `build/`.

Family-level artifacts (e.g. the VS Code extension `package.json` covering all 14
themes) need a single-theme variant for the app: exporting a custom draft yields a
minimal working package for just that theme. Keep the repo build path emitting the
full family exactly as before.

**App export UI.** In the tool's export section: pick a target tool (all 12) and
download a zip named for the theme + tool. Contents: the emitted file(s) for that tool
plus a `README.md` with concrete install instructions for it (instruction templates
live next to the emitters so they version together). "Full export" downloads one zip
with every format in per-tool folders, the raw theme JSON, and a master README linking
the per-tool manuals. `ansiMapping` must be exposed to the app (extend
`app/src/themes.ts`, which already reads the source JSON).

**Zip.** Assembled in the browser. Adding a tiny zip dependency to `app/package.json`
(e.g. fflate) is acceptable — the app is self-contained and the repo root stays
dependency-free; a hand-rolled stored-entry zip is equally fine if it stays small.

**Gating.** Format exports produce artifacts people install, so they're gated on all
hard rules passing, same as "Copy theme JSON". (Raw JSON save from 030 stays ungated.)

**Boundary.** `scripts/generate.js` (refactor to shell), new `lib/` emitter module(s),
`app/src/` export UI, `app/src/themes.ts`, `app/package.json` (zip dep if used).
Docs: root `README.md` "How themes are generated" and explorer sections — verify
whether they need updating; skip with a one-line reason if already accurate.
Exclusions: no backend/Pages Function, no import of foreign formats (import stays raw
theme JSON only, from 030), no changes to what `npm run build` emits.

Validation: the refactor must be behavior-preserving — `npm run build` output under
`build/` is byte-identical before and after (diff the trees). Then
`node scripts/validate.js` and `cd app && npm run build`.

## Acceptance criteria

- Every one of the 12 generator formats is exportable from the tool as a zip
  containing the theme file(s) for the current draft plus a README with install steps
  for that tool.
- A full-export zip contains all formats, the raw theme JSON, and a master README.
- Terminal-format exports honor the source `ansiMapping`; editor-family formats
  (VS Code, IntelliJ, Zed) produce a working single-theme package for the draft.
- Format exports are blocked while any hard rule fails; the raw JSON save is not.
- `build/` output from `npm run build` is byte-identical to pre-refactor output.
- `node scripts/validate.js` and `cd app && npm run build` pass.

## Notes

- Verifying a sample export actually installs (e.g. drop the kitty conf or `.vsix`-less
  VS Code folder in place) is a manual spot-check, not automated.
