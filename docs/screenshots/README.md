# Screenshots

Gallery images for the root `README.md` live in `examples/`, one per theme:
`candela-<NN>-<id>.png` where `NN` is the 1-based theme order (e.g.
`candela-01-sepia-paper.png`). Each is one theme rendered by the explorer app
(`app/`) across the four default panes — terminal, TypeScript (with an inline
problem), Markdown, and git. The PNGs are committed.

## Regenerate

One command captures all themes, driven by Playwright against the app's screenshot
mode (`?theme=<id>&shot=1` — a single chrome-free card that signals readiness
once its fonts load):

```sh
cd app
npm install                     # first time
npx playwright install chromium # first time
# writes docs/screenshots/examples/candela-<NN>-<id>.png for all themes
npm run screenshots -- --out=docs/screenshots/examples
```

`scripts/screenshots.mjs` starts the app's dev server, iterates the theme ids
from `themes/candela-themes.json`, and writes one PNG per theme.
Filenames must stay stable — the root README references them by relative path.
