# 053 — Editor a11y and popover/dialog behavior pass

priority: 60

## What & why

Screen-reader and keyboard support in the editor chrome has concrete holes (found via
accessibility-tree inspection and live testing). One cohesive pass over the editor shell
components.

## Spec

- Label the unlabeled controls: Warm/Cool/Neutral radios and all 10 preview checkboxes
  currently expose only "on"; the two icon-only buttons next to the grayscale/protan
  warnings have no accessible name (app/src/Playground.tsx, PanePicker.tsx).
- Make the Validation/Details/JSON strip a real tablist: `tabpanel` + `aria-controls`,
  roving tabindex, arrow-key navigation (Playground.tsx:910-919).
- Previews picker popover: close on Escape and on outside click (verified it closes only
  by re-clicking the chip).
- Dialog.tsx: unique title id per instance (static `studio-dialog-title` duplicates,
  :34); fix focus restore when the trigger unmounts (Start-over flow drops focus to body).
- Boundary: app/src/Playground.tsx, PanePicker.tsx, Dialog.tsx, styles.css. Visual design
  unchanged; no state-model changes.

## Acceptance criteria

- Every interactive control in the editor exposes a meaningful accessible name (spot-check with an accessibility tree dump).
- Tabs are arrow-key navigable and announced as tabs with their panels.
- The previews popover dismisses on Escape and outside click.
- Two dialogs mounted in sequence never share a DOM id; closing the Start-over dialog leaves focus on a sensible element.
