# Screenshots

Gallery images for the root `README.md`, one per theme: `candela-<id>.png`
(e.g. `candela-sepia-paper.png`). Each is one theme rendered by the explorer app
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
npm run screenshots             # writes docs/screenshots/candela-<id>.png for all themes
```

`scripts/screenshots.mjs` starts the app's dev server, iterates the theme ids
from `themes/candela-themes.json`, and writes one PNG per theme.
Filenames must stay stable — the root README references them by relative path.
