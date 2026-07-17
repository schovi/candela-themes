# Screenshots

Gallery images for the root `README.md`, one per theme: `aurora-<id>.png`
(e.g. `aurora-sepia-paper.png`). Captured from the visual showcase
`docs/design-handover/Aurora Light Themes.dc.html`, which renders every theme
across a terminal, Ruby, Kotlin, and Markdown.

## Regenerate

The showcase is a single scrolling page with one `<section>` per theme (each
headed `NN · Name`). To (re)capture:

1. Open `docs/design-handover/Aurora Light Themes.dc.html` in Chrome.
2. For each theme section, capture the section frame to `aurora-<id>.png`
   using the theme ids from `dist/` (`sepia-paper`, `slate-mist`, `sage`,
   `solarized-lite`, `blossom`, `lagoon`, `meadow`, `apricot`, `periwinkle`,
   `ink-coral`, `graphite-mono`, `tungsten`, `eink-slate`, `contrast-max`).

Any headless-screenshot tool works; the Chrome MCP browser automates it
section by section. Keep filenames stable — the root README references them by
relative path.
