# Screenshots

Gallery images for the root `README.md`, one per theme: `aurora-<id>.png`
(e.g. `aurora-sepia-paper.png`). Each is one theme rendered by the explorer app
(`app/`) across a terminal, Ruby, Kotlin, Markdown, and diagnostics pane. The
PNGs are committed.

## Regenerate

One command captures all 14, driven by Playwright against the app's screenshot
mode (`?theme=<id>&shot=1` — a single chrome-free card that signals readiness
once its fonts load):

```sh
cd app
npm install                     # first time
npx playwright install chromium # first time
npm run screenshots             # writes docs/screenshots/aurora-<id>.png for all 14
```

`scripts/screenshots.mjs` starts the app's dev server, iterates the theme ids
from `docs/design-handover/aurora-themes.json`, and writes one PNG per theme.
Filenames must stay stable — the root README references them by relative path.
