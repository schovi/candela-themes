# 049 — Dark theme authoring in both editor modes

priority: 20
depends: 048

## What & why

The editor cannot author a dark theme: Simple hardcodes `mode:'light'` with bg lightness
clamped to 0.88-0.94 (app/src/derive.ts:132,163), Pro has no mode control at all (nothing
ever writes `draft.mode`), and Auto-fix resolves a dark bg + `mode:light` failure by
lightening the bg back instead of honoring the user's direction. The repo ships 2 dark
themes; the editor should be able to make a third. Decision: full dark support.

## Spec

- Simple: the background Darkness slider crosses the midpoint into dark derivation —
  `deriveTheme` gains a dark branch (bg lightness below 0.5, ink/surface/selection/etc.
  formulas inverted per the shipped dark themes' relationships) and sets `mode:'dark'`
  accordingly. Importing a dark theme and entering Simple must reflect it, not convert it
  to light.
- Pro: add an explicit light/dark mode control (Details tab or the UI token group) writing
  `draft.mode`.
- Auto-fix (app/src/autofix.ts): when the mode/bg-lightness rule fails, move bg toward the
  declared mode rather than always lightening; other floors then re-fit against the new bg.
- Derivation for dark must still pass every hard rule in lib/rules.js for representative
  hues (spot-check with `checkTheme`).
- Boundary: app/src/derive.ts, app/src/Playground.tsx, app/src/autofix.ts. Excludes rule
  changes in lib/rules.js and any shipped-theme edits.

## Acceptance criteria

- Dragging Simple's background darkness past the midpoint produces a valid dark draft (mode:'dark', all hard rules pass) and back again restores light derivation.
- A dark built-in theme opened in the editor survives Simple-mode edits as a dark theme.
- Pro users can flip mode explicitly; the validation pane then judges bg against the chosen mode.
- Auto-fix on a dark-bg/light-mode conflict resolves toward the user's bg direction when mode says dark, and no longer silently lightens a deliberately dark palette when the user flips mode to dark.
- Exported JSON carries the correct mode (drives VS Code uiTheme / IntelliJ dark flag).

## Notes

Depends on 048 because both rework the same derive/guided-edit seam; landing this first
would conflict. Verified live: bg #1e1e28 → autofix returned #ebebf0.
