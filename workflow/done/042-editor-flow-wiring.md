# 042 — Editor flow wiring: cross-zone jumps

priority: 87
depends: 041

## What & why

The 041 app shell puts the verdict (inspector) and the controls (rail) in separate
always-visible zones, but nothing connects them: reading "faint on bg fails AA" still
means hunting the rail by hand for the right token. This task wires the tweak → check
loop so every token the inspector names is one click from its controls. Split out of
041 at groom (user-decided) to keep layout and behavior changes in separate loops.

## Spec

- **Inspector → rail jumps**: every token reference in the inspector — failing rule
  rows, warning rows, contrast-check rows — becomes a jump target. Activating one
  reveals and focuses that token's controls in the rail: in Pro, the token's
  disclosure opens (closing the previously open one, per 040's one-at-a-time rule)
  and the row scrolls into view; in Simple, the relevant step/token is selected.
- Jumps are instant, not smooth — same deviation 040 recorded (smooth scroll
  overshoots while disclosures expand, and ignores `prefers-reduced-motion`).
- **Status-chip retarget**: the app-bar chip's existing validation jump points at the
  inspector zone; verify it works in both the desktop grid (inspector already
  visible — focus, don't scroll the page) and the collapsed mobile column.
- Jump targets are real buttons/links: keyboard-activatable, visible focus, announced
  sensibly (the moved-to control receives focus).
- Ownership surfaces: `app/src/Playground.tsx`, `app/src/styles.css`.
- Excluded: click-in-preview token selection (task 043); any new editing features or
  state-model changes; visual re-skin of inspector rows beyond making them read as
  interactive (hover feedback per 040's floor).

## Acceptance criteria

- Clicking any failing rule, warning, or contrast row in the inspector opens/reveals
  the named token's controls in the rail and moves focus there, in both Pro and
  Simple modes.
- Works keyboard-only with visible focus; reduced motion honored (jumps are instant).
- The same wiring works in the collapsed ≤980px single-column layout.
- No behavior regressions in validation/auto-fix/export; `npm run build` (app)
  type-checks clean; eyeball pass done.
