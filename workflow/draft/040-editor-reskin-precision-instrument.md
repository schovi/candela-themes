# 040 — Editor re-skin: precision instrument

priority: 80
depends: 034, 035, 036, 037, 038, 039

## What & why

The current editor is coherent but its control anatomy is generic where it matters
most for a color tool: featureless slider tracks, a neon stock color wheel arguing
with the anti-neon brand, an undersold pass state (EDITOR-REVIEW.md H2, M7, M8, L8,
L9). The user's brief: go bolder than the current identity — "best theme editor in the
world", surprisingly good. This is a design-led rework of the editor page's visual
language, executed last so it styles the finished feature set (hence `depends:`).

## Spec

- **Design pass first.** Load the `frontend-design:frontend-design` skill and produce a
  short written design plan before any code: palette tokens, type roles, layout
  concept, and ONE signature element; explicitly check the plan against generic
  AI-design defaults and revise. The subject's own world is the material: this is a
  tool that *manufactures color under constraints* — let the instrument feel like that.
  One real aesthetic risk is wanted; commit the plan in the task file's Notes or the
  commit message.
- **Must land inside the new skin** (the review's control-anatomy findings):
  - H/S/L sliders with channel-true gradient tracks (hue spectrum, saturation ramp at
    current hue, lightness ramp) + small numeric readouts (M7). The existing green
    pass-zone shading on L must survive.
  - De-neon'd accent wheel: hue ring rendered at the saturation/lightness band Candela
    actually ships (`ACCENT_SAT 0.5, L 0.42`), not full RGB (H2).
  - Pro token rail density rethought so 20 tokens scan comfortably (e.g. H/S/L in a
    per-token disclosure/popover) (L9).
  - Pass state celebrated: green confirmation in the validation header, warnings kept
    amber, disabled exports unambiguous, hover feedback on interactive controls
    (M8, L8).
- **Constraints.** Site shell/nav stays functional; home/gallery restyle is OUT of
  scope (log a follow-up draft task if the divergence demands it). No new dependencies;
  CSS lives in `app/src/styles.css`. Quality floor without announcing it: visible
  keyboard focus everywhere, `prefers-reduced-motion` respected, editor chrome itself
  clears AA, real responsive pass down to the 600px breakpoint (the review never
  verified small viewports — screenshot evidence required).

Boundary: `app/src/styles.css` (dominant), `app/src/Playground.tsx` and small
components for structure/markup, `app/src/branding.ts` if tokens move there.
Excluded: any behavior/state-model change (033–039 own those), gallery/home.

## Acceptance criteria

- A written design plan (tokens, type, layout, signature, risk) exists and the shipped
  page follows it.
- All four control-anatomy items above are shipped and visually verified (screenshots
  at desktop and 600px in the work log).
- Sliders show channel-true gradients + numeric values; wheel shows no colors more
  saturated than the shipped accent band.
- Keyboard-only walkthrough reaches every control with visible focus; reduced-motion
  honored; no new npm dependencies.
- `npm run build` (app) type-checks clean; `npm run app` eyeball pass done.
