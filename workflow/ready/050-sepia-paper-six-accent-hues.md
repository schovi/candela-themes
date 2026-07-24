# 050 — Retune Sepia Paper to six distinct accent hues

priority: 30

## What & why

Stock Sepia Paper has 5 distinct accent hues, tripping the shared warn-only "6-8 distinct
hues" rule — so the editor's default "Start from a theme" flow greets users with a warning,
and `node scripts/validate.js` warns on a shipped theme. Decision: retune the palette
(not the rule) so theme and rule agree.

## Spec

- Edit only Sepia Paper's accent tokens in themes/candela-themes.json so
  `distinctAccentHues` (lib/rules.js) reports 6-8, while preserving the theme's sepia
  character, all hard rules, and the design invariants in root AGENTS.md (desaturated
  accents, blue+orange dominant, purple/blue lightness separation).
- Standard loop: JSON validity check, `node scripts/validate.js` clean of this warning,
  `npm run build`, eyeball in the explorer.
- Boundary: themes/candela-themes.json (one theme's colors), README theme table only if
  swatches shown there change materially. Excludes lib/rules.js and other themes.

## Acceptance criteria

- `node scripts/validate.js` reports no accent-hue warning for Sepia Paper and no new failures/warnings anywhere.
- Starting the editor from Sepia Paper shows a warning-free Validation pane.
- The theme still reads as Sepia Paper in the gallery (subjective eyeball, keep hue moves minimal).
