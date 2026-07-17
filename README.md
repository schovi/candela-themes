# Aurora — Light Themes for Tired Eyes

**14 light color themes** for terminals and editors, for people who prefer dark
mode but can't comfortably use it — prescription lenses, astigmatism, glare
sensitivity, general eye strain. The goal: keep the calm, low-contrast *feel* of
a good pastel dark theme, but on light backgrounds that don't fight your eyes.

The comfort comes from a few deliberate rules — no pure-white backgrounds (they
cause halation), no pure-black text, AAA body contrast without going to the
painful extreme, and few desaturated accent hues so astigmatic eyes see fewer
color fringes. The full rationale and the token model live in
[`docs/design-handover/README.md`](docs/design-handover/README.md).

## The 14 themes

Themes 01–10 are the production palettes, from calm neutrals to stronger
pastels. 11–14 are experiments, each built around a single constraint.

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

## Gallery

Each shot is one theme rendered across a terminal, Ruby, Kotlin, and Markdown,
captured from the [visual showcase](docs/design-handover/Aurora%20Light%20Themes.dc.html).

> Screenshot capture needs a live browser (Chrome MCP) and is pending manual
> capture — the images below are placeholders. Regenerate per
> [`docs/screenshots/README.md`](docs/screenshots/README.md).

| | |
| --- | --- |
| **01 · Sepia Paper**<br>![Sepia Paper](docs/screenshots/aurora-sepia-paper.png) | **02 · Slate Mist**<br>![Slate Mist](docs/screenshots/aurora-slate-mist.png) |
| **03 · Sage**<br>![Sage](docs/screenshots/aurora-sage.png) | **04 · Solarized Lite**<br>![Solarized Lite](docs/screenshots/aurora-solarized-lite.png) |
| **05 · Blossom**<br>![Blossom](docs/screenshots/aurora-blossom.png) | **06 · Lagoon**<br>![Lagoon](docs/screenshots/aurora-lagoon.png) |
| **07 · Meadow**<br>![Meadow](docs/screenshots/aurora-meadow.png) | **08 · Apricot**<br>![Apricot](docs/screenshots/aurora-apricot.png) |
| **09 · Periwinkle**<br>![Periwinkle](docs/screenshots/aurora-periwinkle.png) | **10 · Ink & Coral**<br>![Ink & Coral](docs/screenshots/aurora-ink-coral.png) |
| **11 · Graphite Mono**<br>![Graphite Mono](docs/screenshots/aurora-graphite-mono.png) | **12 · Tungsten**<br>![Tungsten](docs/screenshots/aurora-tungsten.png) |
| **13 · E-Ink Slate**<br>![E-Ink Slate](docs/screenshots/aurora-eink-slate.png) | **14 · Contrast Max**<br>![Contrast Max](docs/screenshots/aurora-contrast-max.png) |

## Install

Run `npm run build` to generate every theme under `build/` (the generator has
zero dependencies — plain `node scripts/generate.js` works too). Then grab the
one file your tool needs from `build/<tool>/`, or for VS Code install the
packaged `.vsix` (see below). `build/` and `dist/` are generated, not committed.
Theme ids: `sepia-paper`, `slate-mist`,
`sage`, `solarized-lite`, `blossom`, `lagoon`, `meadow`, `apricot`,
`periwinkle`, `ink-coral`, `graphite-mono`, `tungsten`, `eink-slate`,
`contrast-max`.

### iTerm2

1. iTerm2 → **Settings → Profiles → Colors**.
2. **Color Presets… → Import…** and pick a file from `build/iterm2/`, e.g.
   `build/iterm2/sepia-paper.itermcolors`.
3. Open **Color Presets…** again and select the imported preset.

### VS Code

The generated extension lives at `build/vscode/` (all 14 themes in one).

- **As a `.vsix` (recommended):** run `npm run package:vscode` to build and
  package the extension into `dist/aurora-themes-<version>.vsix`, then
  **Extensions → ⋯ → Install from VSIX…** on that file.
- **From source:** copy `build/vscode/` into your extensions folder
  (`~/.vscode/extensions/aurora-themes/`) and reload, or open the folder in VS
  Code and press **F5** to run an Extension Development Host.

Then **Preferences: Color Theme** and pick any *Aurora NN · …* entry.

### IntelliJ / JetBrains IDEs

A packaged theme plugin (all 14 themes) is generated at `build/intellij/`, laid
out under `src/main/resources/` for a Gradle `buildPlugin` (Gradle wiring is out
of scope here). Each theme ships both an editor color scheme (`.icls`) and a UI
theme (`.theme.json`).

- **Editor color scheme only:** **Settings → Editor → Color Scheme → ⚙ →
  Import Scheme…** and pick an `.icls` from
  `build/intellij/src/main/resources/themes/`, e.g. `aurora-sepia-paper.icls`.
- **Full UI theme:** build the plugin from `build/intellij/` and install it, then
  **Settings → Appearance & Behavior → Appearance → Theme** and choose an
  Aurora theme (the `.theme.json` also enables the matching editor scheme).

### Other terminals

The same ANSI palette is generated for six terminals — pick the file for yours
and import per that terminal's docs:

| Terminal | File |
| --- | --- |
| iTerm2 | `build/iterm2/<id>.itermcolors` |
| Alacritty | `build/alacritty/<id>.toml` |
| Kitty | `build/kitty/<id>.conf` |
| WezTerm | `build/wezterm/<id>.toml` |
| Windows Terminal | `build/windows-terminal/<id>.json` (fragment) |
| Ghostty | `build/ghostty/<id>.conf` |

## Contributing / extending

`docs/design-handover/aurora-themes.json` is the single source of truth; run
`npm run build` to regenerate `build/` and `npm run validate` to
check the design invariants. Read [`AGENTS.md`](AGENTS.md) for repo conventions
and [`docs/design-handover/README.md`](docs/design-handover/README.md) for the
token roles and the invariants to preserve if you add or tweak a theme.
