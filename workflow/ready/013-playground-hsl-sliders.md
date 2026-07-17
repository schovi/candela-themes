# 013 — Playground pro page: HSL sliders with passing-zone hints

priority: 40

## What & why

The pro playground editor is hex-only, and feedback is after-the-fact: type a
value, then read red errors. Add per-token H/S/L sliders alongside the hex input
so users can explore colors and see, live, which lightness range still clears the
contrast floor. Full control stays (free drag, export still gated); the sliders
just make "where does this start failing?" visible instead of punitive.

## Spec

In the pro playground editor (`app/src/Playground.tsx`), each color token row
keeps its swatch + hex input and gains three range sliders:

- **Hue** 0–360, **Saturation** 0–100%, **Lightness** 0–100%.
- Bidirectional sync with the hex input: editing hex updates the sliders; dragging
  a slider updates hex + swatch + the live `ThemeCard` preview. Use the existing
  `hexToHsl` / `hslToHex` in `lib/colors.js` — no new color math.

**Passing-zone hint on the lightness track.** For a token that has a contrast
floor, shade the lightness sub-range where the color (same H/S, varying L) still
passes. Derive pass/fail from the shared rule engine, not a re-derived floor:
scan candidate L values, apply each to a working copy, and ask `checkTheme` (the
same oracle `autofix.ts` uses) whether that token's failures clear. Render the
passing span as a shaded track behind the slider (e.g. a CSS gradient).

- Tokens with no floor (e.g. `bg`, `surface`, `border`, `selection`, `cursor`,
  `lineHighlight`) show no meaningful passing zone — detect this generically
  (all-L-values pass ⇒ no shading) rather than hard-coding which tokens have a
  floor, so it tracks the rules if 008's floors change.
- The zone must recompute when the token's hue/saturation change (contrast is a
  function of the actual color, so the passing L span shifts).

**No clamping.** Sliders may be dragged into failing values. Failures still
surface in the feedback pane and keep export blocked (existing gate unchanged).
Auto-fix, export, and the per-token contrast pane stay as-is.

Implementation boundary:
- Production surface: `app/src/Playground.tsx` (token row → slider UI; likely a
  small `SliderRow`/`TokenEditor` subcomponent), `app/src/styles.css`.
- Reuse: `lib/colors.js` (`hexToHsl`/`hslToHex`, `contrastRatio`),
  `lib/rules.js` (`checkTheme` as the passing-zone oracle), `app/src/autofix.ts`
  (its lightness-search pattern — extract a shared helper if it avoids
  duplication; verify, skip if not worth it).
- Exclusions: no `lib/` rule changes, no `scripts/validate.js` change, no JSON
  change, no guided page (that is 014). README playground paragraph: verify
  whether it needs a one-line mention of sliders; skip if already generic.
- Type-check via `cd app && npm run build` (app changes aren't gated by the theme
  validators).

## Acceptance criteria

- Each token row shows Hue/Saturation/Lightness sliders synced bidirectionally
  with its hex input and swatch; moving either updates the live preview.
- The lightness slider shades the passing sub-range for tokens that have a
  contrast floor, computed from the shared rule engine (not a hard-coded floor),
  and the shaded span shifts when that token's hue or saturation changes.
- Tokens without a contrast floor show no false passing-zone restriction.
- Sliders allow dragging into failing values; failures still appear in the
  feedback pane and export stays blocked until clean.
- `cd app && npm run build` succeeds.

## Notes

Independent of 014 (guided page) and 011 (JSON path move — the app reads through
`app/src/themes.ts`). Smaller of the two follow-ups. Color space is HSL by
decision (matches the shipped auto-fix); OKLCH is a possible later upgrade.
