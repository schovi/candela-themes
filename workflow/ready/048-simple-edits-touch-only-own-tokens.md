# 048 — Simple-mode edits touch only their own tokens

priority: 10

## What & why

Any Simple-mode interaction (hue wheel, diagnostic slider, mood, darkness) currently
regenerates the whole palette from `choices` via `deriveTheme`, silently rewriting tokens
the user hand-tuned in Pro (verified: a warning-hue nudge 30°→31° rewrote kw, str, punct,
faint, surface, lineHighlight, error) and zeroing palette-helper adjustments. This breaks
the "one draft, two modes" contract that task 034 was meant to deliver. Decision: a guided
edit applies only to the tokens it names; everything else keeps its current hex.

## Spec

- `updateChoices` (app/src/Playground.tsx:535-540) must stop replacing the draft with a
  full `deriveTheme(choices)` result. Instead apply targeted updates: an accent-hue edit
  recomputes only that accent token; a diagnostic-hue edit only that diagnostic; mood /
  background-darkness edits only the UI tokens the background formula owns (bg, surface,
  border, selection, lineHighlight — and ink/ink2/faint only if that is their sole source).
- Derive formulas in app/src/derive.ts stay the per-token oracles; they are just no longer
  run wholesale. `choices` values for untouched aspects must be reconstructed from the
  current draft on Simple entry so sliders/wheel read true positions (kills the stale
  `choices` desync where the stored error hue was 8 while the color was hue 162).
- Palette-helper adjustments (helperBaseline flow, Playground.tsx:584-589) survive guided
  edits; a guided edit must not reset helper sliders to 0.
- Rename one of the two "Darkness" controls (background step vs palette helper,
  Playground.tsx:837/:872) so the labels differ.
- Guard the Simple-entry path (`deriveChoices`/`deriveTheme`, app/src/derive.ts:74) against
  invalid hex in `draft.colors` — today an unguarded `hexToHsl` would crash the editor.
- Boundary: app/src/Playground.tsx (guided-edit flow), app/src/derive.ts. Excludes dark-mode
  derivation (task 049) and any lib/rules.js change.

## Acceptance criteria

- Moving one diagnostic-hue slider changes only that diagnostic token's hex in the persisted draft; all other tokens byte-identical.
- Changing an accent hue on the wheel changes only that accent token.
- Pro-mode hand-tuned tokens (custom saturation/lightness) survive switching to Simple and making an unrelated guided edit.
- Palette-helper values persist across a guided edit instead of resetting to 0.
- Simple controls show positions derived from the actual current colors after Pro edits (no stale choices).
- The two darkness controls have distinct labels.
- An invalid hex in a stored draft does not crash Simple mode.

## Notes

Findings source: 2026-07-24 editor review (live browser repro + code review). Root cause
map: Playground.tsx:535-540, :584-589; derive.ts:102-127.
