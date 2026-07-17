# 009 — Theme explorer app + automated screenshots

done: 2026-07-17

## What & why

Replace the hand-maintained `.dc.html` showcases with a local Vite app that renders every
theme in the presentation form of the original design (title + tone chip, description,
palette swatches with hex labels, sample panes in the theme's real fonts), with pickers
for what to preview. It also gives us the missing piece: automated screenshot generation —
the root README's gallery references 14 PNGs in `docs/screenshots/` that don't exist yet.
Deleting the old showcases is task 011, not this one.

## Spec

**App shell.** `app/` — Vite + React + TypeScript, self-contained `package.json`
(repo root stays dependency-free). `npm run dev` serves it; no production hosting, this
is a local tool. Import `aurora-themes.json` directly (Vite imports JSON natively) from
its current location; keep the import in one module so task 011 changes one line.

**Explorer view.** One presentation card per theme, faithful to the existing showcase
design (see `Aurora Light Themes.dc.html` for reference): `NN · Name` heading, tone
chip, short description, palette swatch row with hex labels, and sample panes — terminal
(zsh session), Ruby, Kotlin, Markdown preview — all colored from the theme tokens and
rendered in the theme's own code/prose Google Fonts (loaded per theme).
- Descriptions don't exist in the JSON yet — migrate the per-theme description texts
  from the `.dc.html` showcase into a new `description` field on each theme entry
  (additive; validator and generator unaffected, verify neither trips on the new field).
- Pickers/toggles: single-theme vs all-themes scroll, and which sample panes to show.
- Add a **diagnostics pane** (error/warning/ok: squiggles, diff add/delete lines) — the
  design-handover README admits diagnostics were never visually previewed; close that gap.

**Screenshot mode + automation.** `?theme=<id>&shot=1` renders exactly one card,
chrome-free and deterministic (wait on `document.fonts.ready` and signal readiness for
the capture script). `scripts/screenshots.mjs` uses Playwright (devDependency inside
`app/`) to start/attach the dev server, iterate all 14 theme ids, and write
`docs/screenshots/aurora-<id>.png`. One command regenerates the full gallery; update
`docs/screenshots/README.md` to describe the new process (replacing the manual Chrome
steps).

Boundary — production surfaces: `app/` (new), `scripts/screenshots.mjs` (new),
`aurora-themes.json` (additive `description` field only), `docs/screenshots/README.md`,
`docs/screenshots/*.png` (generated, committed), root `README.md` (mention the app +
screenshot command), `workflow/AGENTS.md` (validation section: how to run/build the app
if relevant).
Exclusions: no playground/editing (task 010), no deletion of `docs/design-handover/`
(task 011), no changes to color values or generator emitters.

## Acceptance criteria

- `npm run dev` in `app/` serves the explorer; every theme renders with its palette,
  description, correct Google Fonts, and all sample panes including diagnostics.
- Pickers switch sample panes and single/all-theme views.
- One documented command captures all 14 `docs/screenshots/aurora-<id>.png`, matching
  the filenames the root README gallery already references, and the PNGs are committed.
- `node scripts/validate.js` and `node scripts/generate.js` still pass/produce identical
  `dist/` after the `description` field is added.
- Repo root gains no node_modules/lockfile; everything app-related lives under `app/`.

## Notes

Defaulted: React + TypeScript (the old showcase runtime was already React-based);
Playwright lives in `app/package.json`. The card design in the referenced screenshot is
the visual target — match its structure, not pixel-perfection.
