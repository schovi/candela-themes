# 047 — Unify the editor layout

priority: 20

## What & why

The three-zone editor works, but each zone speaks a different visual language: boxed
control groups on the left, site-colored padding around the themed preview, and preview
controls detached from the inspector. Unify the workspace around a full themed canvas,
quieter rails, and a useful autosave timestamp instead of the floating resume notice.

## Spec

- **Draft status:** remove the floating resume notice for a normally restored local
  draft. Put quiet relative-time text next to the header's draft actions: initially
  `Last draft resumed just now`, then `Last draft resumed X min ago`; after the first
  persisted editor-state change, `Draft saved just now`, then `Draft saved X min ago`.
  Refresh the displayed relative time at minute granularity. Hydration must not be
  mislabeled as a user edit/save. Remove the duplicate save dot + `saved` beside the ID;
  keep the ID, Start over action, malformed-link notices, and replacement dialogs.
- **Preview canvas:** keep the three-column desktop workspace, but let the current
  theme background fill the center zone edge to edge. Remove site-shell padding around
  the preview while preserving a deliberate internal content inset inside the theme
  card. The center contains only the preview and its SVG filter definitions.
- **Inspector controls:** move the pane picker and vision simulation to the top of the
  right rail, before validation. Present both as compact control groups using the same
  label typography, control font, spacing, and selected-state treatment. Keep them in
  normal scroll flow. Validation, export, and JSON retain their existing order and
  behavior below them.
- **Control rail:** remove the enclosing borders, rounded boxes, and inset padding from
  the UI, Syntax, Diagnostics, Palette helpers, and Details groups while retaining
  semantic fieldset/details markup. Separate sections with one consistent instrument
  heading treatment: uppercase mono label plus a quiet horizontal hairline. Use simple,
  consistent rail padding and make token rows, HSL readouts, hex inputs, sliders, and
  section headings shrink or wrap without horizontal scrolling.
- **Responsive shell:** preserve independent zone scrolling on desktop and the existing
  single-column story order on smaller screens. Adjust rail sizing/breakpoint only as
  needed so neither the page nor an individual zone scrolls horizontally at the visual
  check widths.
- Ownership is `app/src/Playground.tsx` and editor-scoped rules in
  `app/src/styles.css`; touch the local-storage state shape only if needed for the
  timestamp. Preserve compatibility with existing stored v1 drafts. No new dependency.
- Excluded: new editor features, theme/palette changes, changes to Home or Themes,
  gallery-card restyling, sticky inspector controls, and documentation changes.

## Acceptance criteria

- Reloading with a saved local draft restores it without the floating resume banner and
  shows the relative resume status by Download draft JSON / Start over. The first real
  persisted change switches the copy to the relative saved status; the text remains
  accurate as minutes pass.
- The center zone is an edge-to-edge live theme surface with no site-colored outer
  margin; its content keeps a readable internal inset and all preview token inspection
  behavior still works.
- Preview selection and Vision are the first controls in the right rail and read as one
  coherent control system; validation, export, and Theme JSON still work below them.
- The left rail uses unboxed sections with the shared heading treatment. All Pro and
  Simple controls remain usable without horizontal page or rail scrolling.
- Desktop keeps three independently scrolling zones; the collapsed layout keeps the
  controls → preview → inspector order. Visual checks at 1512×982, 980px, and 600px show
  no clipped controls or horizontal overflow.
- Keyboard focus remains visible, editor state still autosaves/restores, Start over
  still clears it, and validation/auto-fix/export behavior is unchanged.
- `cd app && npm run build` succeeds and an `/editor` eyeball pass covers Pro and Simple
  modes at the three target widths.
