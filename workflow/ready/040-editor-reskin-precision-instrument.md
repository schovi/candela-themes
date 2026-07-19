# 040 — Editor re-skin: precision instrument

priority: 80

## What & why

The editor's control anatomy is generic where it matters most for a color tool:
featureless slider tracks, a neon stock color wheel arguing with the anti-neon brand,
a dense Pro token wall, an undersold pass state. These are the only EDITOR-REVIEW.md
findings still open — everything else shipped in 033–039 (verified live in Chrome
2026-07-19):

| Review finding | Status |
|---|---|
| H2 neon wheel | **this task** |
| M7 featureless H/S/L sliders, no numerics | **this task** |
| M8 pass state undersold | **this task** |
| L8 no hover feedback, ambiguous disabled buttons | **this task** |
| L9 Pro token rail wall | **this task** |
| H1, H3, H4, M1–M6, L1–L7, L10–L12 | shipped (033–039) |

Design direction decided at groom (user-confirmed): **instrument on paper** with the
**hue dial** as signature.

## Design plan (committed — the shipped page follows this)

**Concept.** Candela is the SI unit of luminous intensity. The editor is a calibrated
optical instrument laid on the existing paper page: metrology anatomy (engraved
scales, tick marks, mono numerals) applied to the controls only. Site shell, home,
gallery untouched.

**Palette.** No new hues — the instrument layer is drawn entirely from existing site
tokens: paper `#f2ecdf`, surface `#fbf7ee`, ink `#322f28`, scale/tick `#5f584b`
(hairline weight), navy `#30577d` (interactive), amber `#9a5b2c` (warnings), plus the
existing validation green for the pass state. Channel gradients are computed
per-control (CSS gradients, no images): hue spectrum at the shipped accent band, sat
ramp at current H/L, lightness ramp at current H/S.

**Type roles.** Newsreader stays page-title only; Atkinson stays labels/prose;
JetBrains Mono (with `font-variant-numeric: tabular-nums`) becomes the instrument
voice — every numeral, readout, degree label, scale endpoint, and hex.

**Layout & story.** The page reads in workflow order — *name it → shape it → watch it
→ verify it → ship it* — fixing the current top region (screenshot evaluated at groom:
export cluster first in the right column, "Export blocked" shouting before any
preview, meta form ahead of the creative controls, three disconnected status voices).

- **Instrument header bar** (one row, replaces the scattered toolbar + resume banner
  + floating status): draft name inline-editable with the id beneath it, autosave
  state as a quiet dot+word, Simple/Pro toggle, and one live status chip — red
  "5 checks failing" / green "all pass" — that scrolls to the validation section.
  Download draft JSON and Start over become quiet text actions here. Resume context
  collapses into one dismissible line under the bar.
- **Left rail = creative controls only.** Colors first. Meta (tone, description,
  fonts) moves into a collapsed "Details" disclosure at the rail's end.
- **Right column order**: previews (pane picker + vision toggle as one compact chip
  row above the panes, replacing the checkbox wall) → validation (meter + details)
  → **export as the finale** — target tool + primary download, with "Download all
  formats", "Copy theme JSON", "Copy link" as captioned secondary actions and the
  install link inline. The gate reads top-down: verdict first, then the actions it
  gates.

Control column reads as an instrument rail:
- Every slider becomes a calibrated scale: gradient-filled track where the axis is a
  color channel, small tick marks, caliper-line thumb, right-aligned mono numeric
  readout. The L slider keeps its pass-zone bracket, restyled as engraved zone marks.
- Pro token rail: one compact row per token (swatch · name · hex · HSL readout);
  a disclosure expands that token's three gauge sliders (one open at a time), so 20
  tokens scan in roughly one viewport.
- Pass state celebrated: status line + validation header get a green filled
  confirmation ("all checks pass — ready to export"); warning count stays amber;
  disabled exports visibly disabled; hover feedback on every interactive control.

**Signature (the one bold element).** The accent wheel becomes an engraved **hue
dial**: an annulus rendered exactly at the shipped saturation band (`ACCENT_SAT 0.5`,
`L 0.42` — the H2 fix), degree ticks every 15° with labels at 0/90/180/270, and every
syntax token's hue plotted as a labeled marker ON the ring — the palette's hue
geometry visible at once. Center shows the selected token and its hue readout.
Existing click/drag-to-set-hue behavior is preserved.

**Motion.** One orchestrated moment: when validation transitions to all-pass, the
meter fills green with a short sweep. `prefers-reduced-motion`: instant state change.

**Risk & discipline.** The risk is metrology density — ticks and numerals everywhere
can tip into busy. Discipline: ticks only on interactive scales, one signature (the
dial), everything else quiet. Generic-defaults check done: the cream+serif shell is
inherited (kept for cross-page coherence, not chosen); the added layer derives from
the subject (photometry), numbering encodes the real wizard sequence, and the
signature encodes real data.

## Spec

- Ownership surfaces: `app/src/styles.css` (dominant), `app/src/Playground.tsx` and
  `app/src/ExportControls.tsx` + small components for structure/markup,
  `app/src/branding.ts` if tokens move there.
- Excluded: any behavior/state-model change (033–039 own those); home/gallery restyle
  (log a follow-up draft if divergence demands it); no new npm dependencies; no new
  fonts.
- Quality floor without announcing it: visible keyboard focus everywhere,
  `prefers-reduced-motion` respected, editor chrome itself clears AA, real responsive
  pass down to the 600px breakpoint.

## Acceptance criteria

- The shipped page follows the design plan above; deviations are noted with a reason.
- The page reads in workflow order: header bar (name, mode, status chip), controls
  left, then previews → validation → export in the right column; no export action
  appears before the previews, and the status chip, validation header, and export
  gate all report the same state.
- Hue dial: ring (not disc) rendered at the shipped accent band with no pixel more
  saturated than it; degree ticks; all token hues plotted as markers; selected token
  + hue readout in the center; set-hue interaction still works.
- Every slider in the editor shows calibrated-scale anatomy with a numeric readout;
  sliders whose axis is a color channel show channel-true gradient tracks; the L
  pass-zone marking survives.
- Pro token rail: 20 tokens scan compactly via per-token disclosure; each row shows
  swatch, name, hex, and HSL values without expanding.
- Pass state: green confirmation in status line and validation header, amber warning
  count, unambiguous disabled exports, hover feedback on interactive controls.
- Keyboard-only walkthrough reaches every control with visible focus; reduced motion
  honored; screenshots at desktop and 600px in the work log.
- `npm run build` (app) type-checks clean; `npm run app` eyeball pass done.
