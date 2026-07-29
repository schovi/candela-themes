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

## Real-editor shots (manual)

`intellij/`, `sublime/`, `vscode/` and `zed/` hold shots taken in the actual editor, whole
window and chrome included — the app-rendered cards above show an editor pane only, so they
can't show what a theme does to a sidebar or a status bar. Directory names are the tool key
`lib/emitters.js` uses, not the process name. `sublime/sublime-{light,dark}.png`,
`vscode/vscode-{light,dark}.png` and `zed/zed-{light,dark}.png` lead their generated readmes
(see [`../marketplace-listing.md`](../marketplace-listing.md)); the IntelliJ pair is uploaded
by hand through the JetBrains plugin form.

These are hand-captured, so pin the window geometry first or two shots never line up.

**1200x760 at (100, 100)**, Sublime Text:

```sh
osascript -e 'tell application "System Events" to tell process "sublime_text"
  set w to first window whose subrole is "AXStandardWindow"
  set position of w to {100, 100}
  set size of w to {1200, 760}
end tell'
```

```sh
screencapture -x -R100,100,1200,760 docs/screenshots/sublime/sublime-light.png
```

Then per theme: switch the color scheme, re-run `screencapture` with a new filename.
The window never moves, so the frames are pixel-aligned.

Notes:

- The process name is the binary, not the app name — `sublime_text`, `Code`,
  `idea`, `zed`. List candidates with
  `osascript -e 'tell application "System Events" to get name of every process'`.
- A zoomed window silently ignores `set size`. Un-maximize first, then read the size
  back (`get size of first window whose subrole is "AXStandardWindow"`) before capturing.
- `window 1` is unreliable: Sublime's autocomplete and tooltips are windows too, and
  they sort first. `subrole is "AXStandardWindow"` picks the real editor window; it
  works for any Cocoa app.
- The terminal running `osascript` needs **Accessibility** permission
  (System Settings → Privacy & Security → Accessibility), otherwise every call fails
  with `-1719`.
- On a Retina display the PNG comes out 2400x1520. Downscale with
  `sips -Z 1200 <file>` if a listing caps image width.
