# 038 — Colorblind and grayscale preview simulation

done: 2026-07-19

## What & why

Candela's whole pitch is vision-science (protan/deutan-safe hue pairs, grayscale
luminance separation — `docs/vision-research.md`), and the validator warns about
exactly these properties, but the editor gives no way to *see* them. A vision
simulation toggle turns abstract warnings into a two-second visual check — the wow
feature that is also on-brand.

## Spec

- **Simulation filters.** Hidden inline SVG defs with `feColorMatrix` for protanopia
  and deuteranopia (standard Viénot/Brettel-approximation matrices) and a luminance
  grayscale matrix; applied to the preview container via `filter: url(#…)`. No
  dependencies, no canvas.
- **UI.** Compact segmented control near the Previews picker: `Vision: Normal ·
  Grayscale · Protan · Deutan`. Ephemeral view state — not persisted, resets to Normal
  on load (decided).
- **"See it" hook.** The colorblind/grayscale-related warnings (error/ok grayscale
  separation, purple/blue lightness) get an inline action that flips the sim to the
  relevant mode. If 036's plain-language layer exists, attach there; otherwise attach
  to the raw warning list and note it.
- Filter applies to preview panes and the palette chip row (the things a theme author
  judges), not to the editor chrome.

Boundary: `app/src/Playground.tsx` (or the preview column component),
`app/src/styles.css`. Excluded: gallery/home simulation, persistence, re-skin (040).

## Acceptance criteria

- Switching to Grayscale/Protan/Deutan visibly transforms all preview panes and palette
  chips; Normal restores instantly; editor chrome is unaffected.
- A grayscale-separation warning offers a one-click jump into Grayscale view.
- Default is Normal on every load; no localStorage writes for sim state.
- Works with `prefers-reduced-motion` (no transition requirement) and keyboard.
- `npm run build` (app) type-checks clean.
