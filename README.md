<p align="center">
  <img src="assets/icon/candela-icon-256.png" alt="Candela" width="128">
</p>

<h1 align="center">Candela</h1>

<p align="center">
  <strong>Color, measured for tired eyes.</strong>
</p>

<p align="center">
  A family of light schemes for terminals and editors, plus dark companions.
  Candela brings the calm feel of a good pastel dark theme to an off-white canvas
  for people who find dark mode uncomfortable.
</p>

<p align="center">
  <a href="https://github.com/schovi/candela-themes/releases/latest"><img src="https://img.shields.io/github/v/release/schovi/candela-themes?style=flat-square&color=3a7bc8" alt="Latest release"></a>
  <a href="https://github.com/schovi/candela-themes/actions/workflows/ci.yml"><img src="https://img.shields.io/github/actions/workflow/status/schovi/candela-themes/ci.yml?branch=main&style=flat-square" alt="Build"></a>
  <a href="https://candela.ink"><img src="https://img.shields.io/badge/explorer-candela.ink-3a7bc8?style=flat-square" alt="Theme explorer"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License"></a>
</p>

<p align="center">
  <img src="docs/screenshots/examples/candela-sepia-paper.png" alt="Candela Sepia Paper across terminal, TypeScript, Markdown, and git previews">
</p>

<p align="center">
  <strong><a href="https://candela.ink">Browse every theme live at candela.ink</a></strong><br>
  Or explore every theme in the <a href="#gallery">gallery below</a>.
</p>

<!-- Release announcement: drop this block once 1.0.0 is a few versions old. The
     release badge above carries the version permanently; this exists only to warn
     people upgrading across the rename. -->
> [!NOTE]
> **Candela is 1.0.** Theme names and ids are a stable contract from here on.
> Getting there meant renaming them once: names lost their `01 · ` prefix, and six
> ids changed. An updated editor will not find its old theme name and falls back to
> the default — pick it again, one time. Terminal, Neovim and Helix users have a
> one-line config edit.
>
> **[What changed, with the full id mapping →](https://github.com/schovi/candela-themes/releases/tag/v1.0.0)**

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

## The themes

Lightweight, embeddable previews are available in [`docs/swatches/`](docs/swatches/).

Themes are grouped by kind, and a light/dark pair always sits together. 01–10 are
the main palettes, from calm neutrals to stronger pastels. 11–17 explore one design
idea each: E-Ink Slate stands alone, then three pairs run back to back so the light
and dark reading of the same idea sit side by side. 18–24 are dark: mostly the heritage of palettes developers already
know. 25–26 are one harbor at dawn and at dusk.

Every theme carries one **kind**, the gallery's main filter:

- **tone** (12) — the mood of the page: warm, cool, pastel, fresh.
- **heritage** (6) — palettes you already know, retuned to Candela's contrast floors.
- **experiment** (8) — one comfort idea pushed hard: near-monochrome, low blue light,
  maximum acuity.

Separately, eight themes carry a `pair`: a light/dark set designed together
(Arclight, Hearth, Harbor, and Graphite/Azure Mono). The other eighteen have no
counterpart, and that is not a gap — see [D14](docs/decisions.md).

| # | Name | Kind | Tone | Code font | Prose font |
| --- | --- | --- | --- | --- | --- |
| 01 | Sepia Paper | tone | Warm | JetBrains Mono | Source Serif 4 |
| 02 | Slate Mist | tone | Cool | IBM Plex Mono | IBM Plex Sans |
| 03 | Sage | tone | Neutral (low-vision) | Fira Code | Atkinson Hyperlegible |
| 04 | Solarized Lite | heritage | Warm classic | Source Code Pro | Newsreader |
| 05 | Blossom | tone | Pastel rose | DM Mono | DM Sans |
| 06 | Lagoon | tone | Cool aqua | Space Mono | Work Sans |
| 07 | Meadow | tone | Fresh green | Spline Sans Mono | Spline Sans |
| 08 | Apricot | tone | Warm peach | Red Hat Mono | Hanken Grotesk |
| 09 | Periwinkle | tone | Pastel indigo | Roboto Mono | Public Sans |
| 10 | Ink & Coral | tone | High-contrast | Overpass Mono | Lora |
| 11 | E-Ink Slate | experiment | *Reflective paper* (ultra-low chroma) | Fira Code | Atkinson Hyperlegible |
| 12 | Graphite Mono | experiment | *One accent* (near-monochrome) | IBM Plex Mono | IBM Plex Sans |
| 13 | Azure Mono | experiment | *Dark* (one accent, cool) | IBM Plex Mono | IBM Plex Sans |
| 14 | Hearth Dawn | experiment | *Low blue light* (evening) | JetBrains Mono | Source Serif 4 |
| 15 | Hearth Dusk | experiment | *Dark* (low blue light, evening) | JetBrains Mono | Source Serif 4 |
| 16 | Arclight Dawn | experiment | *Acuity first* (maximal legibility) | Overpass Mono | Lora |
| 17 | Arclight Dusk | experiment | *Dark* (acuity first) | Overpass Mono | Lora |
| 18 | Nocturne | heritage | *Dark* (One Dark heritage) | JetBrains Mono | Public Sans |
| 19 | Borealis | tone | *Dark* (pastel) | DM Mono | DM Sans |
| 20 | Nightshade | heritage | *Dark* (purple, Dracula heritage) | Fira Code | Hanken Grotesk |
| 21 | Blue Hour | heritage | *Dark* (indigo, Tokyo Night heritage) | IBM Plex Mono | IBM Plex Sans |
| 22 | Ember | heritage | *Dark* (warm retro, Gruvbox heritage) | Source Code Pro | Newsreader |
| 23 | Moss & Magenta | heritage | *Dark* (vivid, Monokai heritage) | Space Mono | Work Sans |
| 24 | Amber Mono | experiment | *Dark* (one accent, warm) | IBM Plex Mono | IBM Plex Sans |
| 25 | Harbor Dawn | tone | Warm (gold-led) | Spline Sans Mono | Work Sans |
| 26 | Harbor Dusk | tone | *Dark* (watery blue) | Spline Sans Mono | Work Sans |

What each experiment explores:

- **Graphite Mono** — near-monochrome syntax with one blue accent.
- **Hearth Dawn** — a warm palette for evening use.
- **E-Ink Slate** — nearly grayscale syntax, like a Kindle.
- **Arclight Dawn** — deep accents and near-white paper for maximum legibility.

Three of those four have a dark counterpart: **Arclight Dusk** for Arclight Dawn,
**Azure Mono** for Graphite Mono, **Hearth Dusk** for Hearth Dawn. Near-monochrome
got two dark readings — **Amber Mono** (warm) and **Azure Mono** (cool) — and the
`pair` key links Graphite Mono to Azure Mono, the closer translation of the two.
E-Ink Slate has none, and deliberately so — on a dark ground every token has to
be lighter than the background to stay legible, which crowds near-grayscale
syntax into a band too narrow to tell tokens apart. The evidence is in
[`docs/dark-palette-exploration.md`](docs/dark-palette-exploration.md).

The dark companions 15–20, each one in the lineage of a palette developers
already know — recognizable heritage, retuned to Candela's contrast rules rather
than copied:

- **Nocturne** — Atom's classic One Dark, the palette a generation of developers
  grew up on, with accents lifted just enough to clear AA on the dark ground.
- **Borealis** — near-black charcoal under soft candy accents (teal, lilac,
  coral), like the northern lights the set is named for.
- **Nightshade** — violet and orchid over a blue-black ground, in Dracula's
  lineage, desaturated until the accents stop fringing.
- **Blue Hour** — the deep indigo of the hour after sunset, following Tokyo
  Night's low-chroma dusk.
- **Ember** — amber and clay on warm brown-black, carrying Gruvbox's retro heat.
- **Moss & Magenta** — lime green against magenta on olive-black, Monokai's
  contrast pairing pulled back from neon.

And the dark experiments, 21–24:

- **Arclight** — near-black under accents pushed past AA toward AAA, for when
  sharpness is the limiter rather than glare.
- **Amber Mono** — warm grays with a single amber doing all the semantic
  lifting, like a filament terminal.
- **Hearth** — an evening dark: no short-wavelength blue anywhere, just amber,
  clay and one soft green on a lit-room ground.
- **Azure Mono** — Amber Mono's cool twin, one azure accent over cool grays.

And the pair 25–26, one harbor at either end of the day. Both carry the same
watery blue, so they read as one theme in two lights rather than two themes:

- **Harbor Dawn** — first light: gold arriving over a page that has barely any
  color yet, and the night still in the ink, which is a deep harbor blue rather
  than the near-neutral every other light theme uses.
- **Harbor Dusk** — last light: that same blue deepened into the ground, with a
  dark sunset orange leading over it and the rust it fades into on the selection.

## Gallery

Preview every theme across terminal, TypeScript, Markdown, and git panes.

| | |
| --- | --- |
| **Sepia Paper**<br>![Sepia Paper](docs/screenshots/examples/candela-sepia-paper.png) | **Slate Mist**<br>![Slate Mist](docs/screenshots/examples/candela-slate-mist.png) |
| **Sage**<br>![Sage](docs/screenshots/examples/candela-sage.png) | **Solarized Lite**<br>![Solarized Lite](docs/screenshots/examples/candela-solarized-lite.png) |
| **Blossom**<br>![Blossom](docs/screenshots/examples/candela-blossom.png) | **Lagoon**<br>![Lagoon](docs/screenshots/examples/candela-lagoon.png) |
| **Meadow**<br>![Meadow](docs/screenshots/examples/candela-meadow.png) | **Apricot**<br>![Apricot](docs/screenshots/examples/candela-apricot.png) |
| **Periwinkle**<br>![Periwinkle](docs/screenshots/examples/candela-periwinkle.png) | **Ink & Coral**<br>![Ink & Coral](docs/screenshots/examples/candela-ink-coral.png) |
| **E-Ink Slate**<br>![E-Ink Slate](docs/screenshots/examples/candela-eink-slate.png) | **Graphite Mono**<br>![Graphite Mono](docs/screenshots/examples/candela-graphite-mono.png) |
| **Azure Mono**<br>![Azure Mono](docs/screenshots/examples/candela-azure-mono.png) | **Hearth Dawn**<br>![Hearth Dawn](docs/screenshots/examples/candela-hearth-dawn.png) |
| **Hearth Dusk**<br>![Hearth Dusk](docs/screenshots/examples/candela-hearth-dusk.png) | **Arclight Dawn**<br>![Arclight Dawn](docs/screenshots/examples/candela-arclight-dawn.png) |
| **Arclight Dusk**<br>![Arclight Dusk](docs/screenshots/examples/candela-arclight-dusk.png) | **Nocturne**<br>![Nocturne](docs/screenshots/examples/candela-nocturne.png) |
| **Borealis**<br>![Borealis](docs/screenshots/examples/candela-borealis.png) | **Nightshade**<br>![Nightshade](docs/screenshots/examples/candela-nightshade.png) |
| **Blue Hour**<br>![Blue Hour](docs/screenshots/examples/candela-blue-hour.png) | **Ember**<br>![Ember](docs/screenshots/examples/candela-ember.png) |
| **Moss & Magenta**<br>![Moss & Magenta](docs/screenshots/examples/candela-moss-magenta.png) | **Amber Mono**<br>![Amber Mono](docs/screenshots/examples/candela-amber-mono.png) |
| **Harbor Dawn**<br>![Harbor Dawn](docs/screenshots/examples/candela-harbor-dawn.png) | **Harbor Dusk**<br>![Harbor Dusk](docs/screenshots/examples/candela-harbor-dusk.png) |

## Install

**Download a release.** The [latest GitHub release](https://github.com/schovi/candela-themes/releases/latest)
includes ready-made archives for terminals, editors, Neovim, and Helix, plus an
all-formats ZIP and a `SHA256SUMS.txt` manifest.

**From a marketplace.** Live listings:

- **VS Code:** [marketplace.visualstudio.com/items?itemName=candela.candela-themes](https://marketplace.visualstudio.com/items?itemName=candela.candela-themes)
- **Open VSX** (VSCodium, Cursor, Windsurf, Gitpod): [open-vsx.org/extension/candela/candela-themes](https://open-vsx.org/extension/candela/candela-themes)
- **JetBrains IDEs:** [plugins.jetbrains.com/plugin/33084-candela-themes](https://plugins.jetbrains.com/plugin/33084-candela-themes)

Zed and Sublime are added here once their registry listings land.

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
`hearth-dawn`, `eink-slate`, `arclight-dawn`, `nocturne`, `borealis`,
`nightshade`, `blue-hour`, `ember`, `moss-magenta`, `arclight-dusk`, `amber-
mono`, `hearth-dusk`, `azure-mono`, `harbor-dawn`, `harbor-dusk`.

### iTerm2

1. iTerm2 → **Settings → Profiles → Colors**.
2. **Color Presets… → Import…** and pick a file from `build/iterm2/`, e.g.
   `candela-sepia-paper.itermcolors`.
3. Open **Color Presets…** again and select it (it appears as *candela-…*).

### VS Code

Run `npm run package` to build all supported packages. Format-specific commands
are available below when you need only one package.

The extension, containing every theme, lives at `build/vscode/`.

- **From the Marketplace (recommended):** search **Candela Themes** in the Extensions
  view, or install from
  [the listing](https://marketplace.visualstudio.com/items?itemName=candela.candela-themes).
- **As a `.vsix`:** `npm run package:vscode` builds and packages it
  into `dist/candela-themes-<version>.vsix`, then **Extensions → ⋯ → Install from
  VSIX…** on that file.
- **From source:** copy `build/vscode/` into `~/.vscode/extensions/candela-themes/`
  and reload, or open the folder in VS Code and press **F5**.

Then **Preferences: Color Theme** and pick any *Candela …* entry.

### IntelliJ / JetBrains IDEs

Easiest path: **Settings → Plugins → Marketplace**, search *Candela Themes*
([listing](https://plugins.jetbrains.com/plugin/33084-candela-themes)).

To build it yourself, the plugin lives at `build/intellij/`. Each theme ships an editor
color scheme (as `.xml`, which the plugin's `editorScheme` loads, plus an identical
`.icls` for manual import) and a UI theme (`.theme.json`).

- **As a plugin zip:** install JDK 17+ and Gradle 9+, then run
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
archive per terminal under `dist/`. Each archive contains every theme file and
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

The extension, containing every theme, lives at `build/zed/`. In Zed, open
**Extensions**, choose **Install Dev Extension**, and select that directory.
`npm run package:zed` copies the complete extension to `dist/zed/` for dev install
and writes `dist/candela-themes-zed-<version>.tar.gz` for download.

### Obsidian

Run `npm run package:obsidian`, then extract
`dist/candela-themes-obsidian-<version>.zip`. Copy its `Candela/` folder into your
vault's `.obsidian/themes/` directory. In **Settings → Appearance**, choose
**Candela**. With the Style Settings plugin installed, choose light and dark
palettes separately in **Settings → Style Settings → Candela**.

### Sublime Text

Run `npm run package:sublime`, then copy
`dist/candela-themes.sublime-package` into Sublime Text's `Installed Packages/`
folder. For a loose-file install, copy the `.sublime-color-scheme` files from
`build/sublime/` into `Packages/User/`.

### Neovim

The Neovim plugin, containing every theme, lives at `build/nvim/`. Extract the release
archive and point lazy.nvim or packer at that local plugin directory, or copy its
`colors/` directory onto your runtimepath. Then run `:colorscheme
candela-sepia-paper` (or another theme id). `npm run package:nvim` writes the
release archive to `dist/candela-themes-nvim-<version>.tar.gz`.

### Helix

Drop-in files for every theme live under `build/helix/`. Install them per
Helix's documentation. Run `npm run package:bundles` to create
`dist/candela-themes-helix-<version>.tar.gz`, containing every file and
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
      "name": "Sepia Paper",
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
byte-identical files). Hex helpers live in `lib/colors.js`; the emitters live in
`lib/emitters/`, one module per tool (`terminals.js`, `vscode.js`, `intellij.js`,
`zed.js`, `sublime.js`, `nvim.js`, `helix.js`) over a shared `shared.js`, with
`index.js` exposing the two entry points and the install manuals. The Node generator
is only the filesystem shell, while the browser editor calls the same emitters for
downloads.

`lib/emitters/` is the source of truth for each generated layout and token mapping.

## Contributing / extending

`themes/candela-themes.json` is the single source of truth; `build/` and `dist/` are
generated and never committed. Local setup, the edit/validate loop, screenshots, and
what a pull request needs live in [`CONTRIBUTING.md`](.github/CONTRIBUTING.md). Read
[`AGENTS.md`](AGENTS.md) for the token roles and the design invariants to preserve.

To preview every theme, run the explorer (`npm run app`): `/` introduces Candela,
`/themes` is the filterable gallery, and `/editor` creates or customizes a light or
dark theme with Simple and Pro controls over one browser-local draft (in Simple the
background-darkness slider crosses into dark past its midpoint; Pro sets the mode
directly). The editor runs the same
invariants as `scripts/validate.js` (shared code in `lib/`), so **Copy theme JSON**
stays disabled until every hard rule passes; paste the result into a new `themes[]`
entry and it clears `node scripts/validate.js` as-is.

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
