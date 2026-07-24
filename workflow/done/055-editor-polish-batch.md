# 055 — Editor polish batch: dead control, truncation, alignment, collision hint

done: 2026-07-24

## What & why

Four small verified UX papercuts, batched as one loop over the editor UI.

## Spec

- Dead code: the "Start fresh?" affordance gates on a notice starting with "Resuming"
  that nothing ever sets (app/src/Playground.tsx:765-766) — either wire the resume notice
  it was designed for or delete the branch.
- Pro token labels truncate ("bg · backgro…", "lineHighligh…") at default sidebar width —
  fit the full role text (shorter copy, tooltip, or layout).
- Onboarding ("How would you like to begin?") card titles don't align across the row —
  top-align all four cards' headings.
- Simple accent wheel: when a drag lands an accent on another accent's identical hex
  (reproduced: str landed exactly on type's #7436a0), surface a gentle hint (warn-only,
  consistent with the existing warnings pane; hard rules stay untouched).
- Boundary: app/src/Playground.tsx, styles.css, onboarding markup. No rules/derive/export
  changes beyond the display-level hint.

## Acceptance criteria

- No unreachable "Start fresh?" branch remains (either reachable with a real resume notice, or gone).
- All token rows show their full label at default width.
- Onboarding card titles sit on one baseline row.
- Two accents sharing one hex produce a visible warn-only hint in the editor.
