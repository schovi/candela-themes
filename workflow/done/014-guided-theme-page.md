# 014 — Guided theme page: derive a valid palette from a few choices

done: 2026-07-17

## What & why

The pro playground exposes 19 raw tokens — too much for a newcomer. Add a third
"Guided" view that derives a complete, rule-valid palette from a few high-level
choices, so a beginner can produce a shippable theme without understanding the
token model. The pro playground stays exactly as-is; Guided is the friendly path.

## Spec

New view in the explorer (`View → Guided`, third option next to All / Single /
Playground). It shares the same draft shape, live `ThemeCard` preview, rule
engine, and gated "Copy theme JSON" export as the playground. Three steps:

**1. Background.** Mood (warm / cool / neutral) + a darkness slider. Derive
`bg`, `surface` (slightly lighter), `border`, `ink`, `ink2`, `faint` as
contrast-stepped shades of a mood-tinted gray: `ink` clears AAA on `surface`,
`ink2`/`faint` step down but stay AA on `bg`, `surface` stays lighter than `bg`,
nothing pure white/black. Valid by construction.

**2. Accents.** A hue wheel to choose accent hues, assigned across the 7 syntax
tokens (`kw`, `str`, `fn`, `num`, `type`, `builtin`, `punct`). Chroma capped to
the desaturated range; lightness auto-set (HSL search, same approach as
`autofix.ts`) so each accent clears its AA floor on `bg`. Aim for 6–8 distinct
hues with blue+orange emphasis (guidance, not a hard clamp).

**3. Diagnostics.** Pick/adjust `error` (red), `warning` (amber), `ok` (green);
auto-nudge to satisfy the diagnostic collision rules (`error`≠`num`, etc.) and
improve the CVD / grayscale warnings where lightness/hue moves allow.

The derivation re-validates against the shared rules at each step; any derived
value that would fail is nudged (reuse `autoFix` / its lightness search) so the
guided output is always exportable. Export produces the same `themes[]` entry as
the playground.

Implementation boundary:
- Production surface: new `app/src/Guided.tsx` (+ step/wheel sub-UI),
  `app/src/App.tsx` (add the `guided` view + control gating),
  `app/src/styles.css`; root `README.md` (extend the playground paragraph to
  mention Guided — verify wording).
- Reuse: `lib/rules.js` (`checkTheme`, `expectedTokens`, constants),
  `lib/colors.js` (`hexToHsl`/`hslToHex`, `contrastRatio`, luminance),
  `app/src/autofix.ts` (lightness search — extract a shared helper if both this
  and 013 want it; DRY over duplicate search loops).
- Exclusions: no `lib/` rule changes (008 owns the rules), no
  `scripts/validate.js` change, no JSON change, no new dependency, no
  server/persistence. Pro playground behavior unchanged.
- Type-check via `cd app && npm run build`.

## Acceptance criteria

- A Guided view, separate from the pro playground, derives a full palette from
  background (mood + darkness), accent hue choices, and diagnostics, with live
  preview in the selected theme.
- For the default guided selections and a couple of varied choices, the derived
  palette shows zero hard failures and export is enabled; the copied JSON pasted
  into `aurora-themes.json` clears `node scripts/validate.js` unedited.
- The accent step fills all 7 syntax tokens and targets 6–8 distinct hues; the
  diagnostics step yields `error`/`warning`/`ok` that satisfy the collision
  rules.
- The pro playground view and its behavior are unchanged; `cd app && npm run
  build` succeeds.

## Notes

Independent of 013 (may reuse a slider component if 013 ships first, but does not
require it) and 011 (app reads the JSON through `app/src/themes.ts`). Larger of
the two follow-ups but one cohesive outcome (the guided view). Full 3-step depth
(wheel + per-token assignment + interactive diagnostics) chosen over a lean MVP.
