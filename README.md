<p align="center">
  <img src="assets/icon/candela-icon-256.png" alt="Candela" width="128">
</p>

<h1 align="center">Candela</h1>

<p align="center">
  <strong>Light themes for tired eyes</strong>
</p>

<p align="center">
  14 light themes for terminals and editors, plus two dark companions.
  Candela brings the calm feel of a good pastel dark theme to an off-white canvas
  for people who find dark mode uncomfortable.
</p>

<p align="center">
  <a href="https://github.com/schovi/candela-themes/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/schovi/candela-themes/ci.yml?branch=main&style=flat-square" alt="Build"></a>
  <a href="https://candela.ink"><img src="https://img.shields.io/badge/explorer-candela.ink-3a7bc8?style=flat-square" alt="Theme explorer"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <img src="docs/screenshots/candela-sepia-paper.png" alt="Candela 01 · Sepia Paper across terminal, TypeScript, Markdown, and git previews">
</p>

<p align="center">
  <strong><a href="https://candela.ink">Browse every theme live at candela.ink</a></strong><br>
  Or explore all 16 themes in the <a href="#gallery">gallery below</a>.
</p>

## Why Candela feels calmer

They're often too bright and too saturated. Candela follows a few rules to make
light themes calmer:

1. **Off-white backgrounds, never pure white.** Pure white glares. Soft tinted
   paper (`bg`, with panels a shade lighter in `surface`) doesn't.
2. **Dark gray text, never pure black.** Candela inks are very dark but never
   `#000`. Dark gray on off-white just reads calmer for a lot of people.
3. **Strong contrast, not maximal.** Body text (`ink` on `surface`) clears WCAG
   AAA (7:1+). Secondary text (`ink2`) and comments (`faint`) step down but
   still clear WCAG AA (4.5:1 against `bg`, the surface terminals paint on).
4. **Low-saturation colors.** Desaturated accents reduce the colored fringing
   that can make text harder to read.
5. **Blue and orange carry the meaning.** Keeping them distinct helps keywords,
   strings, and functions stay easy to tell apart, including for many people with
   color-vision deficiencies.
6. **Same colors mean the same thing in every theme,** so switching never makes
   you relearn what you're looking at.

The vision-science rationale, including where common advice gets it wrong, is in
[`docs/vision-research.md`](docs/vision-research.md).

## The 16 themes

Themes 01–10 are the main palettes, from calm neutrals to stronger pastels.
11–14 explore one design idea each. 15–16 are dark companions tuned to the same
contrast rules.

| # | Name | Tone | Code font | Prose font |
| --- | --- | --- | --- | --- |
| 01 | Sepia Paper | Warm | JetBrains Mono | Source Serif 4 |
| 02 | Slate Mist | Cool | IBM Plex Mono | IBM Plex Sans |
| 03 | Sage | Neutral (low-vision) | Fira Code | Atkinson Hyperlegible |
| 04 | Solarized Lite | Warm classic | Source Code Pro | Newsreader |
| 05 | Blossom | Pastel rose | DM Mono | DM Sans |
| 06 | Lagoon | Cool aqua | Space Mono | Work Sans |
| 07 | Meadow | Fresh green | Spline Sans Mono | Spline Sans |
| 08 | Apricot | Warm peach | Red Hat Mono | Hanken Grotesk |
| 09 | Periwinkle | Pastel indigo | Roboto Mono | Public Sans |
| 10 | Ink & Coral | High-contrast | Overpass Mono | Lora |
| 11 | Graphite Mono | *One accent* (near-monochrome) | IBM Plex Mono | IBM Plex Sans |
| 12 | Tungsten | *Low blue light* (evening) | JetBrains Mono | Source Serif 4 |
| 13 | E-Ink Slate | *Reflective paper* (ultra-low chroma) | Fira Code | Atkinson Hyperlegible |
| 14 | Contrast Max | *Acuity first* (maximal legibility) | Overpass Mono | Lora |
| 15 | Nocturne | *Dark* (One Dark heritage) | JetBrains Mono | Public Sans |
| 16 | Borealis | *Dark* (pastel) | DM Mono | DM Sans |

What each experiment explores:

- **Graphite Mono** — near-monochrome syntax with one blue accent.
- **Tungsten** — a warm palette for evening use.
- **E-Ink Slate** — nearly grayscale syntax, like a Kindle.
- **Contrast Max** — deep accents and near-white paper for maximum legibility.

The two dark companions:

- **Nocturne** — Atom's classic One Dark, the palette a generation of developers
  grew up on, with accents lifted just enough to clear AA on the dark ground.
- **Borealis** — near-black charcoal under soft candy accents (teal, lilac,
  coral), like the northern lights the set is named for.

## Gallery

Preview all 16 themes across terminal, TypeScript, Markdown, and git panes.

| | |
| --- | --- |
| **01 · Sepia Paper**<br>![Sepia Paper](docs/screenshots/candela-sepia-paper.png) | **02 · Slate Mist**<br>![Slate Mist](docs/screenshots/candela-slate-mist.png) |
| **03 · Sage**<br>![Sage](docs/screenshots/candela-sage.png) | **04 · Solarized Lite**<br>![Solarized Lite](docs/screenshots/candela-solarized-lite.png) |
| **05 · Blossom**<br>![Blossom](docs/screenshots/candela-blossom.png) | **06 · Lagoon**<br>![Lagoon](docs/screenshots/candela-lagoon.png) |
| **07 · Meadow**<br>![Meadow](docs/screenshots/candela-meadow.png) | **08 · Apricot**<br>![Apricot](docs/screenshots/candela-apricot.png) |
| **09 · Periwinkle**<br>![Periwinkle](docs/screenshots/candela-periwinkle.png) | **10 · Ink & Coral**<br>![Ink & Coral](docs/screenshots/candela-ink-coral.png) |
| **11 · Graphite Mono**<br>![Graphite Mono](docs/screenshots/candela-graphite-mono.png) | **12 · Tungsten**<br>![Tungsten](docs/screenshots/candela-tungsten.png) |
| **13 · E-Ink Slate**<br>![E-Ink Slate](docs/screenshots/candela-eink-slate.png) | **14 · Contrast Max**<br>![Contrast Max](docs/screenshots/candela-contrast-max.png) |
| **15 · Nocturne**<br>![Nocturne](docs/screenshots/candela-nocturne.png) | **16 · Borealis**<br>![Borealis](docs/screenshots/candela-borealis.png) |

## Install

**Download a release.** The [latest GitHub release](https://github.com/schovi/candela-themes/releases/latest)
includes ready-made archives for terminals, editors, Neovim, and Helix, plus an
all-formats ZIP and a `SHA256SUMS.txt` manifest.

**From a marketplace.** Live listings:

- **VS Code:** [marketplace.visualstudio.com/items?itemName=Candela.candela-themes](https://marketplace.visualstudio.com/items?itemName=Candela.candela-themes)

More (Open VSX, JetBrains, Zed, Sublime) are added here as each listing goes live.

**Or build from source:**

```sh
git clone https://github.com/schovi/candela-themes && cd candela-themes
npm run build   # or: node scripts/generate.js — no dependencies needed
```

This generates every theme under `build/`. Grab the file your tool needs from
`build/<tool>/`, or install the VS Code `.vsix` (below). `build/` and `dist/` are
generated, not committed.

Theme ids: `sepia-paper`, `slate-mist`, `sage`, `solarized-lite`, `blossom`,
`lagoon`, `meadow`, `apricot`, `periwinkle`, `ink-coral`, `graphite-mono`,
`tungsten`, `eink-slate`, `contrast-max`, `nocturne`, `borealis`.

### iTerm2

1. iTerm2 → **Settings → Profiles → Colors**.
2. **Color Presets… → Import…** and pick a file from `build/iterm2/`, e.g.
   `candela-sepia-paper.itermcolors`.
3. Open **Color Presets…** again and select it (it appears as *candela-…*).

### VS Code

Run `npm run package` to build all supported packages. Format-specific commands
are available below when you need only one package.

The extension, containing all 16 themes, lives at `build/vscode/`.

- **From the Marketplace (recommended):** search **Candela Themes** in the Extensions
  view, or install from
  [the listing](https://marketplace.visualstudio.com/items?itemName=Candela.candela-themes).
- **As a `.vsix`:** `npm run package:vscode` builds and packages it
  into `dist/candela-themes-<version>.vsix`, then **Extensions → ⋯ → Install from
  VSIX…** on that file.
- **From source:** copy `build/vscode/` into `~/.vscode/extensions/candela-themes/`
  and reload, or open the folder in VS Code and press **F5**.

Then **Preferences: Color Theme** and pick any *Candela NN · …* entry.

### IntelliJ / JetBrains IDEs

The theme plugin, containing all 16 themes, lives at `build/intellij/`. Each theme
ships an editor color scheme (as `.xml`, which the plugin's `editorScheme`
loads, plus an identical `.icls` for manual import) and a UI theme
(`.theme.json`).

- **As a plugin zip (recommended):** install JDK 17+ and Gradle 9+, then run
  `npm run package:intellij`. This builds the plugin, runs `buildPlugin`, and
  writes `dist/candela-themes-intellij-<version>.zip`. In the IDE, choose
  **Settings → Plugins → ⚙ → Install Plugin from Disk…** and select the zip.
- **Editor scheme only:** **Settings → Editor → Color Scheme → ⚙ → Import
  Scheme…** and pick an `.icls` from `build/intellij/src/main/resources/themes/`.
- **From source:** run Gradle's `buildPlugin` task in `build/intellij/`, install
  the resulting zip, then
  **Settings → Appearance & Behavior → Appearance → Theme** and pick a Candela
  theme.

### Other terminals

The same ANSI palette is available for six terminals. Pick your file and import
it according to that terminal's documentation:

Run `npm run package:bundles` to create one release
archive per terminal under `dist/`. Each archive contains all 16 theme files and
short installation instructions; loose files remain available under `build/`.

| Terminal | File |
| --- | --- |
| iTerm2 | `build/iterm2/candela-<id>.itermcolors` |
| Alacritty | `build/alacritty/candela-<id>.toml` |
| Kitty | `build/kitty/candela-<id>.conf` |
| WezTerm | `build/wezterm/candela-<id>.toml` |
| Windows Terminal | `build/windows-terminal/candela-<id>.json` (fragment) |
| Ghostty | `build/ghostty/candela-<id>.conf` |

### Zed

The extension, containing all 16 themes, lives at `build/zed/`. In Zed, open
**Extensions**, choose **Install Dev Extension**, and select that directory.
`npm run package:zed` copies the complete extension to `dist/zed/` for dev install
and writes `dist/candela-themes-zed-<version>.tar.gz` for download.

### Sublime Text

Run `npm run package:sublime`, then copy
`dist/candela-themes.sublime-package` into Sublime Text's `Installed Packages/`
folder. For a loose-file install, copy the `.sublime-color-scheme` files from
`build/sublime/` into `Packages/User/`.

### Neovim

The Neovim plugin, containing all 16 themes, lives at `build/nvim/`. Extract the release
archive and point lazy.nvim or packer at that local plugin directory, or copy its
`colors/` directory onto your runtimepath. Then run `:colorscheme
candela-sepia-paper` (or another theme id). `npm run package:nvim` writes the
release archive to `dist/candela-themes-nvim-<version>.tar.gz`.

### Helix

Drop-in files for all 16 themes live under `build/helix/`. Install them per
Helix's documentation. Run `npm run package:bundles` to create
`dist/candela-themes-helix-<version>.tar.gz`, containing all 16 files and
installation instructions.

## How themes are generated

`themes/candela-themes.json` is the source of truth. `scripts/generate.js` (Node,
no dependencies) reads each theme's `colors` block and emits whatever each tool
needs:

```json
{
  "themes": [
    {
      "id": "sepia-paper",
      "name": "01 · Sepia Paper",
      "tone": "warm",
      "tags": ["warm"],
      "mode": "light",
      "fonts": { "code": "JetBrains Mono", "prose": "Source Serif 4" },
      "colors": { "bg": "#f2ecdf", "surface": "#fbf7ee", "ink": "#322f28", ... }
    }
  ],
  "ansiMapping": { ... }
}
```

Every entry declares `mode` (`"light"` or `"dark"`) and a non-empty `tags` array.
Both are required by validation, and `mode` and `tags` power the explorer's filters.

Build from the repo root:

```sh
npm run build   # or: node scripts/generate.js
```

It wipes and rewrites `build/`, emitting one file per theme per tool at
`build/<tool>/<theme-id>.<ext>`. Output is deterministic (re-running gives
byte-identical files). Hex helpers live in `lib/colors.js`; pure per-format emitters
and their install manuals live in `lib/emitters.js`. The Node generator is only the
filesystem shell, while the browser editor calls the same emitters for downloads.

`lib/emitters.js` is the source of truth for each generated layout and token mapping.

## Contributing / extending

`themes/candela-themes.json` is the single source of truth. Run `npm run build` to
regenerate `build/` and `npm run validate` to check the design rules. Read
[`AGENTS.md`](AGENTS.md) for the token roles and the rules to preserve when you
add or tweak a theme.

To preview every theme (palette, fonts, sample panes, diagnostics), run the
explorer. First-time setup installs its deps under `app/`:

```sh
cd app && npm install && npx playwright install chromium
```

Then from the repo root, `npm run app` serves the explorer and
`npm run app:screenshots` regenerates the gallery PNGs. See
[`docs/screenshots/README.md`](docs/screenshots/README.md).

The static app has three routes: `/` introduces Candela, `/themes` provides the
filterable gallery, and `/editor` creates or customizes a theme. Gallery cards use
configurable preview panes, defaulting to terminal, TypeScript, Markdown, and git,
and link directly into the editor. The editor offers Simple and Pro controls over
one browser-local draft, validates it, and downloads individual or combined formats.

The editor runs the same invariants as `scripts/validate.js` (shared code in `lib/`), so
**Copy theme JSON** stays disabled until every hard rule passes. Paste the result
into a new `themes[]` entry and it clears `node scripts/validate.js` as-is.

## Publishing the explorer

Cloudflare Pages publishes the explorer on pushes to `main` and creates previews
for pull requests. The build runs the theme validator before Vite, while GitHub
Actions runs the same checks before merge. Screenshots remain a local command.

| Setting | Value |
| --- | --- |
| Project | `candela-themes`, branch `main`, root `app` |
| Build | `node ../scripts/validate.js && npm run build` |
| Output | `dist` |
| Domain | `candela.ink`; `candela.schovi.cz` redirects through [`app/public/_redirects`](app/public/_redirects) |
