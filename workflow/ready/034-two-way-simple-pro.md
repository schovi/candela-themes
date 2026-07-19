# 034 — Two-way Simple↔Pro and wizard simplification

priority: 20

## What & why

Simple and Pro present as a toggle but the model is one-way: Pro edits never map back
to wizard `choices`, so Pro→Simple regenerates from stale defaults, destroying the
draft (EDITOR-REVIEW.md M1, root cause). Make the switch two-way by reverse-deriving
choices from the draft, and remove the ceremony that no longer earns its place
(wizard step nav, "Save draft" mislabel, start-screen jargon — L5, L12, L10).

## Spec

- **Reverse derivation.** New `deriveChoices(draft): GuidedChoices` in
  `app/src/derive.ts`: mood = nearest of warm/cool/neutral by bg hue+saturation
  (`MOOD_BG` distances), darkness inverted from bg L (`bgL = 0.94 - 0.06t`), accent
  hues = hue of each syntax token, diagnostic hues likewise; name/tone/description/
  fonts carried from the draft. Pro→Simple: `setChoices(deriveChoices(draft))` then
  re-derive the draft. Small lightness drift from `fitLightness` is acceptable.
- **Remove the Pro→Simple `window.confirm`** — the switch is no longer destructive.
- **Remove wizard step navigation.** Delete Back/Next/"Finish wizard" and `wizardStep`
  state; Simple always shows all sections (the current step-0 layout). "Guided wizard"
  start card just enters Simple mode. Numbered legends (1 · Background …) stay — they
  communicate order without gating it.
- **Simple-mode metadata edits must not re-derive colors.** Name/tone/description
  changes update the draft directly (they don't affect `deriveTheme` output colors);
  today `updateChoices` re-derives and silently discards palette-helper adjustments
  (review, product section).
- **Rename "Save draft" → "Download draft JSON"** (it calls `downloadRaw`; next to
  "Saved automatically" the current label lies).
- **Start-screen copy:** "Fork existing" → "Start from a theme"; "Upload JSON" →
  "Open a saved draft (.json)"; keep wording free of unexplained jargon.

Boundary: `app/src/Playground.tsx`, `app/src/derive.ts`. Excluded: remaining native
confirms (037), chip labels/highlighting (035), any visual restyle (040).

## Acceptance criteria

- Fork Sepia Paper → tweak one token hue in Pro → switch to Simple: no confirm dialog,
  name/tone/description/fonts kept, background unchanged, wheel and sliders reflect the
  actual draft; switch back to Pro without touching anything → draft unchanged.
- Round trip Simple→Pro→Simple with no edits is lossless.
- No Back/Next/Finish controls anywhere; Simple shows Background, Accents, Diagnostics,
  Palette helpers together.
- In Simple: move a palette helper, then edit the name — the helper adjustment survives.
- Button reads "Download draft JSON" and still downloads the full draft file.
- `npm run build` (app) type-checks clean.
