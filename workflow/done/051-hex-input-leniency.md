# 051 — Lenient hex input and honest invalid-state UI

done: 2026-07-24

## What & why

The hex fields accept only strict `#rrggbb`. Pasting `aabbcc` (no hash) or `abc`
(shorthand) is rejected with only a red border — the most common paste formats fail.
While a field holds an invalid value, the native color swatch jumps to black and the
H/S/L sliders disable, even though the committed color is still valid.

## Spec

- Normalize on commit in the hex field handler (app/src/Playground.tsx:402-431): accept
  `rrggbb`, `#rgb`, `rgb`, uppercase; expand/prefix to canonical lowercase `#rrggbb`
  before `HEX.test`/commit. Truly invalid input keeps the error state.
- While the text is invalid, the swatch shows the last committed color (not #000000) and
  the H/S/L sliders stay enabled (they already operate on the committed value).
- Boundary: the TokenEditor input handling in app/src/Playground.tsx only. Draft state
  model, rules, and derive untouched. lib/colors.js `normalizeHex` stays strict.

## Acceptance criteria

- Pasting `aabbcc`, `ABC`, or `#abc` into any hex field commits the expanded canonical hex to the draft.
- Typing garbage shows the error state but the swatch keeps the last valid color and sliders remain usable.
- Committed values in the persisted draft are always canonical lowercase `#rrggbb`.
