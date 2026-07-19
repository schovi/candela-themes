# 033 — Editor correctness & trust fixes

done: 2026-07-19

## What & why

The editor's core promise — "green means it would ship as-is" — is currently false in
two ways, and three smaller correctness gaps erode trust (EDITOR-REVIEW.md H3, H4, M2,
L2, L3). Fix the contract first; everything else builds on a validator the user can
believe.

## Spec

- **Export payload passes the validator (H4).** `exportEntry` in `app/src/Playground.tsx`
  omits `mode` and `tags`; `lib/rules.js:91-97` hard-fails both. Include `mode` and
  `tags` (fallback `['custom']`) in the copied/exported JSON.
- **mode↔bg consistency rule (H3).** Add a hard rule to `lib/rules.js`: `mode: 'light'`
  requires bg lightness > 0.5; `mode: 'dark'` requires < 0.5. Verify all 16 official
  themes still pass `node scripts/validate.js`. The editor imports the same module, so
  the palette-helper dark-flip now blocks export with a named failure instead of staying
  green. Add the rule to the invariants list in root `AGENTS.md`.
- **Deep-link id mismatch (M2).** `/editor?theme=<x>` resolver accepts the canonical id
  OR the slugified display name (`01-sepia-paper` → Sepia Paper). Keep gallery links
  unchanged.
- **Invalid hex never enters the draft (L2).** Hex inputs hold invalid text as local
  field state; the draft (and therefore localStorage and Save-draft downloads) only ever
  receives valid `#rrggbb`. The red invalid styling stays on the field.
- **Name cap (L3).** `maxLength` 60 on the name input (both modes); trim before slugify.
- **Docs count drift.** Root `AGENTS.md` and `workflow/AGENTS.md` say "14 themes"; the
  JSON and site ship 16 (14 light + 2 dark). Update the counts where they appear.

Boundary: `app/src/Playground.tsx`, `lib/rules.js`, `scripts/validate.js` output
unchanged in shape, root `AGENTS.md`, `workflow/AGENTS.md`. Excluded: unknown-`?theme=`
notice UI (task 037), all visual changes (040).

## Acceptance criteria

- With a green editor state, "Copy theme JSON" output pasted into
  `themes/candela-themes.json → themes[]` passes `node scripts/validate.js`.
- Dragging the Contrast palette helper to the far left on a light draft produces a named
  hard failure and blocks export (no more green-while-dark).
- All 16 official themes pass `node scripts/validate.js` with the new rule.
- `/editor?theme=01-sepia-paper` and `/editor?theme=sepia-paper` both open Sepia Paper.
- Typing `zzz` into a hex field never lands in the localStorage draft; reload restores
  the last valid color.
- Theme name input rejects input past 60 chars.
- `npm run build` (app) type-checks clean.

## Notes

Review found a transient blank terminal pane after the dark-flip (L11) — verify it no
longer reproduces once the flip is blocked; if it does, note the repro and leave it.
