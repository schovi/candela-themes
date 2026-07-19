# 035 — Token↔preview highlighting and plain-language labels

priority: 30

## What & why

The token abbreviations (`kw`, `str`, `punct`…) are the core creative control and are
unreadable to Simple mode's own audience — no tooltips or labels exist anywhere
(EDITOR-REVIEW.md H1, the top comprehension finding). Show, don't tell: pointing at a
token lights up the words it colors in the preview. This is the feature that makes the
editor self-explanatory.

## Spec

- **Sample panes tag their spans.** Preview panes (`app/src/samples/`) render
  token-colored spans; give them a `data-token` attribute (they already know their
  token to pick a color — verify how and thread it through; `ThemeCard.tsx` is the
  join point).
- **Highlight interaction.** Hover or keyboard-focus on a token control — Simple accent
  chip, diagnostic row, or Pro token row label — highlights all matching spans across
  visible panes (e.g. underline/halo) and slightly dims non-matching syntax spans.
  Selecting a chip in Simple (`selectedAccent`) keeps a persistent highlight. Pointer
  leaves → normal. CSS-driven (a `data-highlight` attr on the preview root), no
  per-span JS handlers.
- **Human labels on every token control.** Visible short descriptors, not tooltips
  (review verified zero `title`/`aria-label` help today): e.g. `kw · keywords`,
  `str · strings`, `fn · functions`, `num · numbers`, `type · types`,
  `builtin · built-ins`, `punct · punctuation`. Pro rows and Simple chips both.
  Diagnostics sliders: label the axis (it adjusts **hue**) and drop the hardcoded
  color parentheticals that can contradict the live swatch ("warning (amber)" shown
  green — L4); the swatch communicates the color.

Boundary: `app/src/samples/*`, `app/src/ThemeCard.tsx`, `app/src/Playground.tsx`,
`app/src/styles.css`. Excluded: gallery cards (highlight is editor-only for now),
visual re-skin (040).

## Acceptance criteria

- Hovering the `kw` control makes keywords (`function`, `return`, `const`…) visibly
  pop in the TypeScript pane; same pattern works for every syntax and diagnostic token,
  in both Simple and Pro.
- Keyboard focus on the same controls triggers the same highlight.
- No token control anywhere shows a bare abbreviation without its plain word.
- Diagnostic sliders name their axis and never display a color word that contradicts
  the swatch.
- Highlight respects `prefers-reduced-motion` (no pulsing animation when set).
- `npm run build` (app) type-checks clean.
