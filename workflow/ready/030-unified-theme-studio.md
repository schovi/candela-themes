# 030 — Unified theme tool: one page, simple/pro modes, helpers, persistence

priority: 5

## What & why

Merge the two theme-building pages (`/editor` Playground + `/builder` Guided) into one
tool on `/editor`. One draft theme, two editing modes (Simple = guided controls, Pro =
per-token grid), three ways to start (fork existing / blank / wizard), a validation
section with fix actions, preview-pane parity with the Themes gallery, global palette
helpers, localStorage persistence, and raw JSON import/export. This supersedes D2
(separate pages) — D2 itself names this as the choice to revisit; log a superseding
decision via `/workflow:decision`.

## Spec

**Pages & URLs.** `/editor` hosts the unified tool. Remove `builder.html`,
`src/builder.entry.tsx`, the rollup input and dev rewrite for `/builder` in
`vite.config.ts`, and the Builder nav item in `SiteShell.tsx`. Add
`/builder /editor 301` to `app/public/_redirects` (site is live; links must not break).
Gallery Customize links (`/editor?theme=<id>`) keep working.

**One draft, two modes.** Both modes edit one shared draft theme (user decision):

- *Pro* = current Playground surface: token groups with hex + H/S/L sliders and
  pass-zone shading, name/tone/description/fonts.
- *Simple* = current Guided surface: mood, darkness, accent hue wheel, diagnostic hue
  sliders, driving `deriveTheme` into the same draft.
- Simple → Pro keeps the derived draft as-is. Pro → Simple re-derives from the last
  guided choices and requires a confirm that manual token edits will be discarded.

**Start modes.** (a) Fork an existing theme (select + `?theme=` deep-link, as today) —
opens in Pro. (b) Blank template — opens in Pro. (c) Wizard — the Simple controls
presented as a short stepper (background → accents → diagnostics, like Guided's three
fieldsets), landing in the tool in Simple mode.

**Global helpers** (all four, user decision): sliders that recalculate the whole
palette at once, then re-fit lightness so contrast floors keep passing (reuse the
`autofix.ts` fitting approach):

- Contrast — expand/compress the lightness spread between bg and text/syntax tokens.
- Saturation — global chroma scale, capped desaturated (anti-fringing rule).
- Warmth — hue-shift the palette warm/cool without changing token relationships.
- Darkness — rebase bg/surface and re-fit every token's floor (works on any theme,
  unlike the Builder's derive-only slider).

Helpers are relative transforms; capture a baseline when a drag starts so scrubbing is
stable. Exact placement (Pro only vs both modes) is implementation judgement.

**Validation section.** Keep Playground's: live failures/warnings from the shared
`lib/rules.js`, Auto-fix button, per-token contrast table. Visible in both modes.

**Preview.** Replace the hard-coded all-panes `ThemeCard` with the gallery's Previews
picker (checkboxes over `PANE_ORDER`, `DEFAULT_PANES` default). Extract/share rather
than duplicate the picker from `Gallery.tsx`.

**Persistence.** Autosave working state to localStorage (draft, guided choices, mode,
pane selection) and restore on load. `?theme=` seeds a fork of that theme; a stored
draft with unsaved-looking differences is not silently discarded (confirm before
replacing). An explicit reset/start-over exists.

**Raw import/export.** Download the draft as a JSON file and import one back (file
picker or paste), validating shape (all tokens present, `#rrggbb` hexes) before
loading. Raw save/load is a working-state mechanism and is NOT gated on validation;
the existing "Copy theme JSON" (paste into `candela-themes.json`) stays gated on all
hard rules passing.

**Boundary.** `app/src/` (merge Playground + Guided into the unified component, shared
previews picker, autofix/derive reuse), `app/editor.html` copy, `app/builder.html`
(delete), `app/vite.config.ts`, `app/src/SiteShell.tsx`, `app/src/styles.css`,
`app/public/_redirects`. Docs: root `README.md` + `AGENTS.md` describe the explorer's
pages — update the editor/builder mentions. Decision log entry superseding D2.
Exclusions: no multi-format/zip export (task 031), no SPA router (D1 stands), no new
dependencies, gallery and home pages otherwise untouched.

Validation: `cd app && npm run build` (type-check + build); repo gates
(`python3 -m json.tool`, `node scripts/validate.js`) untouched by app-only changes but
run before commit per contract.

## Acceptance criteria

- `/editor` is the only theme-building page; `/builder` 301s to it via `_redirects`,
  and the Builder nav item is gone.
- The tool offers exactly two editing modes with a visible switch; both edit the same
  draft, and Pro → Simple asks for confirmation before discarding manual token edits.
- All three start modes work: forking any of the 14 themes (including via
  `/editor?theme=<id>`), a blank template, and a wizard stepper that lands in Simple.
- All four helper sliders (contrast, saturation, warmth, darkness) recalculate the
  full palette live, and the validation section reflects the result as they move.
- Validation section shows live failures/warnings with Auto-fix and the per-token
  contrast table, in both modes; "Copy theme JSON" stays blocked while any hard rule
  fails.
- The preview area has the same pane-type checkboxes as `/themes` with the same
  defaults.
- Reloading the page restores the in-progress draft, mode, and pane selection from
  localStorage; reset returns to a clean start.
- Raw JSON export downloads the draft even when invalid; importing that file restores
  it; importing malformed JSON is rejected with a message.
- `cd app && npm run build` passes; a superseding decision entry for D2 exists in
  `docs/decisions.md`.

## Notes

- Task 031 (multi-format zip exports) builds on this page's export section.
- Naming inside the code (e.g. renaming `Playground` to something like `Studio`) is
  free judgement; the URL stays `/editor`.
- In-progress tasks 028/029 touch `app/` too (prerender, icon) — coordinate on
  `vite.config.ts` if both are in flight.
