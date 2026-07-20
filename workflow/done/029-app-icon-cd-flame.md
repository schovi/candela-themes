# 029 — App icon: "cd" candle-flame mark

done: 2026-07-20

## What & why

Candela has no real icon — the favicon in `app/index.html` is a placeholder
(cream square + flat blue dot) and the VS Code extension ships without a
Marketplace icon (`scripts/generate.js` has a standing TODO). Give the project
one original mark and wire it into both places that actually consume an icon
today.

**Concept (locked).** Lowercase **"cd"** — the SI symbol for the candela, the
unit of luminous intensity — set in dark "ink" on a warm off-white paper tile,
with a small two-tone flame (warm amber body, calm blue core) resting on the
ascender of the **d** so the letter doubles as a lit candle. Candle ≈ candela ≈
cd. Calm and matte, not glary — the flame is a soft teardrop with at most a
faint warm tint, consistent with the low-glare brand. Reference approved by the
user; see Notes.

## Spec

Produce one master SVG and derive the raster the VS Code Marketplace needs.

**Artwork.**
- Author `assets/icon.svg`, `viewBox="0 0 128 128"`, clean paths only (no
  external refs, no embedded rasters) so it can inline as an HTML data URI.
- Palette from the theme world, desaturated: paper tile `~#f2ecdf`, rounded
  corners ~22% radius; letters ink `~#2b2b2b` (never pure black); flame warm
  amber `~#d8a24a` with an optional calm-blue `~#3a7bc8` core. No pure white,
  no neon, no bloom/rays/drop-shadows. Bold, even letter strokes so "cd"
  survives downscaling.
- Must read at **16px** (favicon — "cd" goes tiny but the flame must still read
  as a warm lit-candle dot) **and 128px** (VS Code tile). Verify both by eye.
- Export `assets/icon-128.png` (128×128) once from the master SVG and commit it
  as a static asset. Repo root stays dependency-light — do NOT add a build-time
  rasterizer dependency; the app already has Playwright if a headless render is
  the easiest way to produce the PNG, otherwise any one-off tool is fine since
  the output is committed.

**Favicon.** Replace the inline placeholder `<link rel="icon" …>` in
`app/index.html` with the new mark (inline SVG data URI, matching the current
approach, or a reference to `assets/icon.svg` — pick whichever keeps the app
build clean).

**VS Code wiring** (`scripts/generate.js`, `emitVSCode`):
- Copy `assets/icon-128.png` into `build/vscode/` (same pattern as the `LICENSE`
  copy) and set `icon: 'icon.png'` in the emitted `package.json`, replacing the
  `// icon: TODO …` comment at ~line 401.
- Drop the `> TODO: no Marketplace icon yet …` line from `vscodeReadme()`
  (~line 364).

**Implementation boundary.**
- Ownership surfaces: new `assets/` (icon.svg + icon-128.png), `app/index.html`,
  `scripts/generate.js`.
- Verify whether the root `README.md` should show the mark; add it only if it
  already has an obvious logo/hero slot, otherwise skip with a one-line reason.
- Exclusions: no logo mark added to the `SiteShell` header wordmark (stays
  text); no new npm dependency at the repo root; no changes to any theme JSON
  or the design validators.

## Acceptance criteria

- A committed icon raster set exists under `assets/icon/` (16→1024 + `favicon.ico`),
  including `assets/icon/candela-icon-128.png` (128×128). *(Delivered in commit
  `f33d36d`; supersedes the original single-`assets/icon.svg` master — see Notes.)*
- `app/index.html` favicon is the real mark, not the cream-square/blue-dot
  placeholder. *(Delivered in commit `0ed347f`: serves `/favicon.ico` +
  `/apple-touch-icon.png`.)*
- `node scripts/generate.js` produces `build/vscode/package.json` with a valid
  `icon` field pointing at `icon.png`, that PNG exists in `build/vscode/`, and the
  Marketplace-icon TODO in the emitted README (`lib/emitters.js`) is gone.
- `python3 -m json.tool themes/candela-themes.json > /dev/null` and
  `node scripts/validate.js` still pass (no regression from the generate change).
- No new dependency in the repo root `package.json`.

## Notes

- Concept chosen after an A/B/C/D exploration (measured-light disc, aperture,
  C-monogram, candle) plus a themed-swatch / luminance-ramp round; the "cd +
  candle-flame" pun won. Approved reference: lowercase "cd" ink on paper, flame
  on the "d" ascender, two-tone amber/blue flame.
- Defaulted (not explicitly confirmed): scope = both real consumers (favicon +
  VS Code PNG); artwork authored in the `/work` loop rather than handed off to a
  designer. Say so if either should change.
- **Divergence from original spec (superseded).** The icon was not authored as
  the single `assets/icon.svg` "cd + d-ascender-flame" master this task described.
  It shipped ahead of this loop as a raster set under `assets/icon/` (commit
  `f33d36d` "icons"), the app favicon was wired to real files (commit `0ed347f`),
  and the README got a hero mark (commit `9dd23be`). By the time this loop ran, the
  only unfinished real consumer was the VS Code Marketplace icon: the emitter still
  carried a "no Marketplace icon yet" TODO and set no `icon` field. This loop closed
  that gap by wiring the existing `assets/icon/candela-icon-128.png` into the VS
  Code family package (`lib/emitters.js` + `scripts/generate.js`, matching the
  LICENSE-copy pattern). No new master SVG was authored — the shipped raster set
  covers every real consumer. Approved by the user to reconcile and close.
