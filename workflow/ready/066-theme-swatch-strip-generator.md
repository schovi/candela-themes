# 066 — Theme swatch strip generator

priority: 5
tags: app, docs

## What & why

Generate a small per-theme "swatch strip" asset — the homepage tile in miniature (name,
tone, the eight color chips, one line of token-colored code) — so anywhere a theme needs
showing we can drop in a ~4 KB image instead of a 650 KB screenshot, and link it to
`candela.ink/themes#<id>`. Two payoffs: committed strips for docs and listings, and a
hotlinkable `https://candela.ink/swatch/<id>.svg` so external posts embed the strip and
click through to the browser.

Nothing in this task rewires the README theme table — that stays on its PNGs and is a
follow-up once the strips exist.

## Spec

**Emitter.** New pure module `lib/swatch.js`: `swatchSvg(theme, options?) -> string`, same
shape as the emitters in `lib/emitters.js` (string in, string out, no I/O, no deps). It reads
only the theme's own `colors`, `name`, `tone`. Content matches `TinyPreview` +
`ThemeIndexCard` in `app/src/Home.tsx`, which is the visual contract to copy:

- Card background `bg`, hairline border `border`, rounded corners.
- Header row: `name` in `ink`, `tone` in `faint`, right-aligned; divider in `border`.
- Chip row: `bg`, `ink`, `kw`, `str`, `fn`, `num`, `type`, `builtin` — same order and same
  eight tokens as the homepage, each a rounded square with a `border` outline (so a `bg`
  chip on a `bg` card is still visible), each with a `<title>` naming its token.
- Code line: `def total(cents) = cents / 100.0`, colored per token exactly as the homepage
  does it (`kw`, `fn`, `punct`, `type`, `num`, `ink`).
- Fixed viewBox with `width`/`height` set, so GitHub and Markdown renderers size it without
  CSS. Text uses generic stacks only (`ui-monospace, SFMono-Regular, Menlo, monospace` for
  code, a system sans stack for the name) — no webfont, no external reference.

SVG has no text measurement. Lay the code line out on a fixed monospace advance (~0.6em)
and anchor the name left / tone right, so a long name can only run toward the middle rather
than collide. Pick a card width that fits the longest current theme name with slack.

**Generator.** New `scripts/swatches.mjs`, invoked by `npm run swatches`:

- Reads `themes/candela-themes.json`, writes `docs/swatches/candela-<id>.svg` for every
  theme (committed, like `docs/screenshots/`), deterministic output — rerunning on an
  unchanged source produces no diff.
- Fails non-zero and names the theme if a required token is missing or the emitted SVG is
  not well-formed XML (parse each one before writing; that is this task's runnable check).
- `--png` additionally writes `docs/swatches/candela-<id>.png` by rasterizing the SVG with
  the Playwright chromium already used by `scripts/screenshots.mjs` (resolved out of
  `app/node_modules` the same way). Wired as `npm run swatches:png`. Without the flag the
  script needs no browser and no dependency.
- Add a `docs/swatches/README.md` in the spirit of `docs/screenshots/README.md`: what these
  are, how to regenerate, how to embed one as a link.

**Site delivery.** The app build must ship the SVGs at `/swatch/<id>.svg` (note: URL uses the
bare theme id, no `candela-` prefix) so `https://candela.ink/swatch/sepia-paper.svg` works.
Keep one source of truth — the committed `docs/swatches/` files — and have `app/vite.config.ts`
serve/copy them rather than generating a second copy. Both dev (`npm run app`) and the built
`app/dist/` must resolve the URL, since Cloudflare Pages deploys the build output.

**Boundary.** Production surfaces: `lib/swatch.js`, `scripts/swatches.mjs`, `package.json`
scripts, `app/vite.config.ts`, `docs/swatches/` (generated SVGs + PNGs + README). Routed docs:
root `AGENTS.md` (the generation/commands section) and `docs/style.md` conventions for the new
doc. Verify whether `README.md` needs a one-line pointer to the strips; skip with a reason if
the existing screenshot section already covers it. Excluded: rewriting the README theme table,
touching `themes/candela-themes.json`, `scripts/screenshots.mjs`, `lib/emitters.js`, any
packaging or release path, and any new npm dependency.

## Acceptance criteria

- `npm run swatches` writes one SVG per theme into `docs/swatches/`, exits zero, and a
  second run leaves the tree clean.
- Each SVG is well-formed XML, self-contained (no external font, image, or script), and
  visually matches the homepage tile: name, tone, the same eight chips in the same order,
  and the token-colored code line.
- The generator exits non-zero naming the offending theme when a token is missing or the
  emitted SVG fails to parse.
- `npm run swatches:png` writes a matching PNG per theme; the plain run works with no
  browser installed.
- `/swatch/<id>.svg` resolves both under `npm run app` and in the built `app/dist/`, for
  every theme id.
- `node scripts/validate.js` and the app build still pass; nothing under `build/` or `dist/`
  is committed.
- Root `AGENTS.md` documents the new commands, and `docs/swatches/README.md` explains
  regeneration and the link-wrapped embed snippet.
