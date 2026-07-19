# 041 — Editor app shell: full-width workspace

priority: 85
depends: 040

## What & why

The editor is a tool trapped in a content-page layout: one long 1180px column where
validation and export live below a preview stack of arbitrary height — on a 14"
laptop the core loop (tweak → check) requires scrolling past content (user screenshot,
groom 2026-07-19). Direction decided with the user: content pages keep the editorial
column; the editor gets its own full-width app shell — a "true app" workspace. 040
ships the control anatomy and story order; this task rebuilds the page frame around
them.

## Spec

- **Editor-only layout shell.** `/editor` breaks out of the 1180px content container
  to full viewport width (site header/nav and footer stay; footer may become a slim
  line). Home and gallery are untouched.
- **Three-zone workspace grid**: control rail (left, fixed width) · preview canvas
  (center, flexible) · inspector (right, fixed width). Each zone scrolls
  independently; the page body itself does not scroll on desktop.
- **Inspector = verdict, always in view**: validation (status, failing rules,
  auto-fix, warnings, contrast checks) plus export as its finale, and the Theme JSON
  panel as a collapsed section or tab. The 040 header status chip stays as the
  compact voice; the inspector is the full one — no more scrolling to learn why
  export is blocked.
- **Preview canvas** owns the pane picker + vision toggle row (from 040) and lays
  panes out in a responsive grid that uses the freed width.
- **Below the desktop breakpoint** (~980px) the workspace collapses back to a single
  scrolling column in story order (controls → previews → inspector); 600px stays
  usable. Zone scrollbars must not trap page scroll on touch.
- Ownership surfaces: `app/src/styles.css`, `app/src/Playground.tsx`,
  `app/src/SiteShell.tsx` (layout variant), `app/src/ExportControls.tsx`.
- Excluded: behavior/state-model changes; home/gallery; new dependencies. Keyboard
  focus, reduced motion, and AA floors carry over from 040.

## Acceptance criteria

- `/editor` renders full-width with the three-zone grid; home and gallery layouts are
  byte-identical in intent (still the 1180px editorial column).
- With 5 hard failures on a 1512×982 viewport, the failing rules and the export gate
  are visible without any page scrolling; each zone scrolls independently.
- Theme JSON is reachable inside the inspector without leaving the workspace.
- Below ~980px the layout collapses to one column in story order and remains usable
  at 600px (screenshots at 1512px, 980px, and 600px in the work log).
- Keyboard-only walkthrough reaches every control across all three zones with visible
  focus; no new npm dependencies.
- `npm run build` (app) type-checks clean; `npm run app` eyeball pass done.

## Notes

- Groomed from the user's "true app feeling" direction. Further follow-ups (if any)
  should be drafted after this ships and the new frame is felt — resist pre-planning
  a "system" beyond it.
