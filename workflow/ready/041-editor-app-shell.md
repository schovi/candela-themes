# 041 — Editor app shell: full-width workspace

priority: 85

## What & why

The editor is a tool trapped in a content-page layout: one long 1180px column where
validation and export live below a preview stack of arbitrary height — on a 14"
laptop the core loop (tweak → check) requires scrolling past content. 040 shipped the
instrument anatomy (dial, gauge sliders, token rail, header bar, export finale); this
task rebuilds the page frame around it into a proper app workspace. Re-groomed
2026-07-19 with the user: **app feel, layout only** — cross-zone flow wiring is 042,
click-in-preview inspection is 043. Preserve the 040 instrument-on-paper feeling; the
shell is quiet paper around the instruments, not a re-skin.

## Spec

- **Editor-only layout shell.** `/editor` breaks out of the 1180px content container
  to full viewport width. Home and gallery are untouched (still the editorial column).
  Footer becomes a slim single line on `/editor` (or folds away below the fold of the
  fixed workspace — implementer's call, note the choice).
- **One app bar** (user-decided): on `/editor` the site header merges with the 040
  studio bar into a single row — wordmark + slim nav on one side, draft name, id +
  save dot, Simple/Pro toggle, status chip, and the quiet actions on the other.
  `SiteShell.tsx` grows a layout variant; home/gallery keep the stacked site header.
- **Three-zone workspace grid**: control rail (left, fixed width) · preview canvas
  (center, flexible) · inspector (right, fixed width). Each zone scrolls
  independently; the page body itself does not scroll on desktop.
- **Inspector = verdict, always in view**: validation (status, failing rules,
  auto-fix, warnings, contrast checks) with export as its finale, and the Theme JSON
  panel as a collapsed section or tab. The app-bar status chip stays as the compact
  voice; the inspector is the full one.
- **Preview canvas** owns the pane picker + vision toggle row and lays panes out in a
  responsive grid that uses the freed width.
- **Welcome = centered canvas state** (user-decided): before a draft exists the app
  shell still renders, with the start cards (blank / fork / simple / upload) centered
  in the workspace and the rails hidden — a document app's "new file" moment, not a
  content page.
- **Below the desktop breakpoint** (~980px) the workspace collapses back to a single
  scrolling column in story order (controls → previews → inspector); 600px stays
  usable. Zone scrollbars must not trap page scroll on touch.
- Ownership surfaces: `app/src/styles.css`, `app/src/Playground.tsx`,
  `app/src/SiteShell.tsx` (layout variant), `app/src/ExportControls.tsx`.
- Excluded: cross-zone flow wiring (task 042); click-in-preview token selection
  (task 043); behavior/state-model changes; home/gallery; new dependencies. Keyboard
  focus, reduced motion, and AA floors carry over from 040.

## Acceptance criteria

- `/editor` renders full-width with the three-zone grid and a single merged app-bar
  row; home and gallery layouts are unchanged (editorial column, stacked site header).
- With 5 hard failures on a 1512×982 viewport, the failing rules and the export gate
  are visible without any page scrolling; each zone scrolls independently.
- Before a draft exists, the start cards render centered in the workspace canvas
  inside the app shell.
- Theme JSON is reachable inside the inspector without leaving the workspace.
- The 040 instrument components (dial, gauge sliders, token rail, validation meter,
  export block) carry over visually intact — the shell changes where they live, not
  how they look.
- Below ~980px the layout collapses to one column in story order and remains usable
  at 600px (screenshots at 1512px, 980px, and 600px in the work log).
- Keyboard-only walkthrough reaches every control across all three zones with visible
  focus; no new npm dependencies.
- `npm run build` (app) type-checks clean; `npm run app` eyeball pass done.

## Notes

- Re-groomed from the user's "proper app feel" direction: keep what works, layout and
  grouping first, flows split out to lower risk and blast radius (041 → 042 → 043).
- 040's status-chip jump scrolls to the validation section; on desktop the inspector
  makes that jump mostly moot — verify it still behaves sanely in the collapsed
  mobile layout, retargeting is 042's job if more than a selector change.
