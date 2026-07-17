# 005 — Invariant + contrast validator

done: 2026-07-17

## What & why

The design invariants (no pure white bg, no pure black ink, body ink ≥7:1 AAA on surface,
6–8 desaturated hues, every token present in all 14 themes) are currently enforced by eye.
This makes adding or tweaking a theme risky and hard to debug. A Node (no-deps) validator
turns those invariants into an automated gate, so a bad edit fails loudly instead of shipping.

## Spec

Runtime: Node.js, zero deps. `node scripts/validate.js` reads
`docs/design-handover/aurora-themes.json`, checks every theme, prints one line per failure with
theme id + token + actual vs. required, and exits non-zero if any check fails.

Checks (from `docs/design-handover/README.md` "Design rules"):
- `bg` and `surface` never `#ffffff`; `surface` lighter than `bg`.
- `ink` never `#000000`; contrast(`ink`, `surface`) ≥ 7:1 (WCAG AAA). Use the standard WCAG
  relative-luminance / contrast-ratio formula (implement inline in `lib/colors.js` — a few lines,
  no dep).
- Every theme defines every token in `tokenReference` (ui + syntax + diagnostics). Nothing missing.
- Accent-hue count in a sane range (warn if outside 6–8; count distinct hues among the syntax
  accents — treat this as a warning, not a hard fail, since it's a judgement call).
- ANSI mapping references only tokens that exist.

Output: green summary when clean; grouped failures when not. Warnings (hue count) print but
don't fail the exit code — only hard invariants do.

Boundary:
- Production surface: `scripts/validate.js`, extend `lib/colors.js` with the contrast helper.
- Contract: consumes `aurora-themes.json` + its `tokenReference`; read-only, never edits the JSON.
- Docs: add the validator to the Validation section of `workflow/AGENTS.md` (the commit gate) and
  mention it in `docs/design-handover/README.md` "Design rules". Verify contrast on all 14
  current themes and, if any real theme fails AAA, report it — do not silently loosen the threshold.
- Exclusions: no auto-fixing of colors; it reports, humans decide.

## Acceptance criteria

- `node scripts/validate.js` runs on stock Node, exits 0 for the current 14 themes (or exits
  non-zero and names the exact failing theme/token if a current theme genuinely violates an
  invariant — surface that, don't hide it).
- Introducing a deliberately bad value (e.g. set one `bg` to `#ffffff`, or one `ink` below 7:1)
  makes it exit non-zero with a clear message naming the theme and token.
- Missing any token in any theme is reported.
- `workflow/AGENTS.md` documents `node scripts/validate.js` as part of the pre-commit gate.

## Notes

Independent of the generator (001) — reads the same JSON, ships on its own. If `lib/colors.js`
already exists from 001, extend it; if this lands first, create it and 001 reuses it.
Depends line intentionally omitted: no build-order dependency either way.
