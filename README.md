# Aurora — Light Themes for Tired Eyes

**14 light color themes** for terminals and editors, for people who prefer dark
mode but can't comfortably use it — prescription lenses, astigmatism, glare
sensitivity, general eye strain. The goal: keep the calm, low-contrast *feel* of
a good pastel dark theme, but on light backgrounds that don't fight your eyes.

The token model and the invariants to preserve if you extend the set live in
[`AGENTS.md`](AGENTS.md); the full vision-science rationale lives in
[`docs/vision-research.md`](docs/vision-research.md).

## Why light themes hurt (and how we fixed it)

The usual complaint isn't "light is bad" — it's that most light themes are built
wrong. Aurora is designed around a handful of vision-comfort principles:

1. **Off-white backgrounds, not pure white.** *Halation* — the glow that bleeds
   text edges, dramatically worse with astigmatism — is a *dark-mode* problem:
   light text on a dark background blooms, and dark backgrounds dilate the pupil
   so more of an imperfect cornea/lens is exposed. That's the strongest reason
   astigmatic readers do better on light backgrounds, and it's Aurora's whole
   point. A pure `#ffffff` background instead causes *glare*; soft off-white /
   tinted paper (`bg`, with panels a touch lighter in `surface`) softens it.
   Never `#fff`. See [`docs/vision-research.md`](docs/vision-research.md).

2. **No pure black text.** Aurora inks are very dark but never `#000` — typically
   around `#22–34` lightness. This is a stated comfort preference, not a contrast
   ceiling: reading performance actually *rises* with contrast, and low-vision
   readers do best at maximal contrast (which is why Contrast Max exists).
   Very-dark-gray on off-white just reads calmer for many people.

3. **High but not maximal body contrast.** Default text (`ink` on `surface`)
   clears **WCAG AAA (~7:1 and up)** so it's genuinely readable. Secondary text
   (`ink2`) and comments (`faint`) step down in a deliberate, readable hierarchy
   — but every syntax and diagnostic token, and `faint`, still clears **WCAG AA
   (4.5:1) against `bg`** (the binding surface, since terminals paint on it).

4. **Low-saturation colors.** Chromatic-aberration fringing — the colored halos
   astigmatic eyes see around text — is driven by *saturation*, not the number of
   hues, so desaturation is the load-bearing rule. Each theme also keeps to
   **6–8 accent hues** for consistency and taste, not as a vision constraint.

5. **Blue / orange as the primary hue anchors.** Blue and orange stay
   distinguishable across almost all color-vision types, so keywords vs. strings
   vs. functions remain legible even for colorblind readers.

6. **Consistent semantic roles.** The same token always means the same thing
   across all 14 themes (see the token reference in [`AGENTS.md`](AGENTS.md)), so
   switching themes never re-teaches your eyes.

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

The four experiments each answer a different question:

- **Graphite Mono** — what if almost everything is gray and *one* blue does all
  the work? (fewest color fringes)
- **Tungsten** — what if we strip short-wavelength blue for evening use, like a
  warm bulb? (Sleep hygiene: evening blue light suppresses melatonin. Blue light
  does *not* cause eye strain — that's reduced blinking and accommodation. See
  [`docs/vision-research.md`](docs/vision-research.md).)
- **E-Ink Slate** — what if syntax is nearly grayscale, like reading on a Kindle?
  (no glow, no vibration)
- **Contrast Max** — what if sharpness, not glare, is your limiter? (deep
  saturated accents, near-white paper)

## Gallery

Each shot is one theme rendered across a terminal, Ruby, Kotlin, Markdown, and
diagnostics, captured from the theme explorer app (`app/`). Regenerate the whole
gallery with `npm run app:screenshots` (see "Contributing / extending").

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

### Other editors (Zed, Sublime, Neovim, Helix)

Drop-in files, all 14 themes each, generated under `build/{zed,sublime,nvim,helix}/`
— not published to any registry, install per that editor's docs. Zed is a single
theme-family file (`build/zed/aurora.json`); the others are one file per theme
(`aurora-<id>.sublime-color-scheme`, `aurora-<id>.lua`, `aurora-<id>.toml`).

## How themes are generated

`themes/aurora-themes.json` is the source of truth. `scripts/generate.js` (Node,
no dependencies) reads a theme's `colors` block and emits whatever format each
tool needs. Structure:

```json
{
  "themes": [
    {
      "id": "sepia-paper",
      "name": "01 · Sepia Paper",
      "tone": "warm",
      "fonts": { "code": "JetBrains Mono", "prose": "Source Serif 4" },
      "colors": { "bg": "#f2ecdf", "surface": "#fbf7ee", "ink": "#322f28", ... }
    }
  ],
  "ansiMapping": { ... }
}
```

Run it from the repo root:

```sh
npm run build   # or: node scripts/generate.js
```

It wipes and rewrites `build/` and emits one file per theme per tool at
`build/<tool>/<theme-id>.<ext>`. Output is deterministic — re-running produces
byte-identical files. `build/` (source fragments) and `dist/` (packaged
distributables like the VS Code `.vsix`) are both generated and gitignored.
Hex helpers live in `lib/colors.js`; per-format emitters live in
`scripts/generate.js`, which is where new tools plug in.

### Terminal (ANSI 16-color)

The top-level `ansiMapping` block maps tokens → the 16 ANSI slots, plus
`background = bg`, `foreground = ink`, `cursor = cursor`,
`selectionBackground = selection`. It's one sensible default (e.g. `yellow → kw`,
`red → num`); change it once in that block and all six terminal formats
(iTerm2, Alacritty, Kitty, WezTerm, Windows Terminal, Ghostty) regenerate.

### Editors — TextMate scopes (VS Code, Sublime)

UI tokens map to the editor's UI keys (`editor.background = surface`,
`editor.foreground = ink`, `editorLineHighlightBackground = lineHighlight`, …);
syntax tokens map to `tokenColors` scopes:

| Aurora token | TextMate scope(s) |
| --- | --- |
| `kw` | `keyword`, `storage` |
| `str` | `string` |
| `fn` | `entity.name.function`, `support.function` |
| `num` | `constant.numeric`, `constant.language` |
| `type` | `entity.name.type`, `entity.name.class`, `support.type` |
| `builtin` | `support`, `variable.language`, `constant.other.symbol` |
| `punct` | `punctuation`, `keyword.operator` |
| `faint` | `comment` |

The VS Code emitter writes a complete vsix-ready extension at `build/vscode/`:
one `package.json` contributing all 14 themes (each `uiTheme: "vs"`) and one
`themes/aurora-<id>-color-theme.json` per theme (`"type": "light"`, workbench
`colors{}` + `tokenColors[]`). The whole workbench is themed (activity bar,
side bar, tabs, status bar, panels, integrated terminal — the terminal ANSI
slots reuse `ansiMapping`), not just the editor pane. `package.json` carries
full Marketplace metadata (placeholder `CHANGEME` URLs until a real repo
exists) and the emitter drops a bundled `README.md`, a `.vscodeignore`, and a
copy of the root MIT `LICENSE` so packaging is warning-free (no `icon` yet —
needs a 128px PNG). Sublime reuses the same scope table, emitting
`build/sublime/aurora-<id>.sublime-color-scheme` (JSON `variables` + `globals` +
`rules[]`).

### JetBrains / IntelliJ

`build/intellij/` is laid out under `src/main/resources/` for a Gradle
`buildPlugin`. Per theme: an editor color scheme `.icls` (XML) and a UI theme
`.theme.json` under `themes/`, plus one `META-INF/plugin.xml` registering all 14
as `themeProvider` extensions. Two hex conventions: **`.icls` drops the leading
`#`** (`value="9a5b2c"`); **`.theme.json` keeps it** (`"#9a5b2c"`).

`.icls` general editor colors (`<colors>`) and the editor background/foreground
(the `TEXT` attribute):

| Aurora token | `.icls` key | Section |
| --- | --- | --- |
| `surface` | `TEXT` → `BACKGROUND` | `<attributes>` |
| `ink` | `TEXT` → `FOREGROUND` | `<attributes>` |
| `cursor` | `CARET_COLOR` | `<colors>` |
| `lineHighlight` | `CARET_ROW_COLOR` | `<colors>` |
| `selection` | `SELECTION_BACKGROUND` | `<colors>` |
| `ink2` | `LINE_NUMBERS_COLOR` | `<colors>` |
| `border` | `GUTTER_BACKGROUND`, `INDENT_GUIDE` | `<colors>` |

`.icls` syntax attributes (`<attributes>`, `FOREGROUND` per key):

| Aurora token | `.icls` attribute key(s) |
| --- | --- |
| `kw` | `DEFAULT_KEYWORD` |
| `str` | `DEFAULT_STRING` |
| `fn` | `DEFAULT_FUNCTION_DECLARATION` |
| `num` | `DEFAULT_NUMBER` |
| `type` | `DEFAULT_CLASS_NAME` |
| `builtin` | `DEFAULT_CONSTANT`, `DEFAULT_METADATA` |
| `punct` | `DEFAULT_OPERATION_SIGN`, `DEFAULT_BRACES`, `DEFAULT_DOT` |
| `faint` | `DEFAULT_LINE_COMMENT`, `DEFAULT_BLOCK_COMMENT` |
| `error` | `ERRORS_ATTRIBUTES` (`EFFECT_COLOR` + `ERROR_STRIPE_COLOR`, wavy) |
| `warning` | `WARNING_ATTRIBUTES` (`EFFECT_COLOR` + `ERROR_STRIPE_COLOR`, wavy) |

Each `.theme.json` sets `dark: false`, points `editorScheme` at its `.icls`, and
carries a modest `ui{}` frame (backgrounds from `bg`/`surface`, borders from
`border`, text from `ink`/`ink2`/`faint`, accents from `fn`).

### Zed, Neovim, Helix

- **Zed** → `build/zed/aurora.json`, a single theme *family* file (`$schema`
  v0.2.0, `themes[]`), each entry `appearance: "light"`. Editor UI keys map
  `editor.background = surface`, `editor.foreground = ink`,
  `editor.active_line.background = lineHighlight`,
  `text/text.muted/text.placeholder = ink/ink2/faint`, `border = border`,
  `players[0] = {cursor, selection}`; `style.syntax{}` maps `keyword→kw`,
  `string→str`, `function→fn`, `number/constant→num`, `type/constructor→type`,
  `variable.special/attribute→builtin`, `operator/punctuation→punct`,
  `comment→faint`; `terminal.ansi.*` reuses `ansiMapping`.
- **Neovim** → `build/nvim/aurora-<id>.lua`, a self-contained Lua colorscheme
  (chosen over base16 YAML so it loads with `:colorscheme aurora-<id>` and zero
  plugins). Sets `vim.o.background = 'light'`, legacy highlight groups
  (`Keyword→kw`, `String→str`, `Function→fn`, `Number/Constant→num`, `Type→type`,
  `PreProc/Special→builtin`, `Operator/Delimiter→punct`, `Comment→faint` italic,
  `Normal = ink on bg`, `Visual = selection`, `CursorLine = lineHighlight`) —
  Neovim links Treesitter groups to these by default — plus the 16
  `vim.g.terminal_color_N` slots from `ansiMapping`.
- **Helix** → `build/helix/aurora-<id>.toml`, a `[palette]` table of every token
  with top-level scope keys: `ui.background = bg`, `ui.text = ink`,
  `ui.cursor = {fg=bg, bg=cursor}`, `ui.selection = {bg=selection}`,
  `ui.cursorline = {bg=lineHighlight}`, `ui.linenr = ink2`; syntax `keyword→kw`,
  `string→str`, `function→fn`, `constant[.numeric]→num`, `type→type`,
  `variable.builtin/label→builtin`, `punctuation/operator→punct`, `comment→faint`,
  `diagnostic.error/warning → error/warning`.

## Contributing / extending

`themes/aurora-themes.json` is the single source of truth; run `npm run build` to
regenerate `build/` and `npm run validate` to check the design invariants. Read
[`AGENTS.md`](AGENTS.md) for repo conventions, the token roles, and the
invariants to preserve if you add or tweak a theme.

To preview every theme (palette, fonts, and sample panes including diagnostics),
run the explorer app. First-time setup installs its deps under `app/` (the repo
root stays dependency-light):

```sh
cd app && npm install && npx playwright install chromium
```

Then from the repo root, `npm run app` serves the explorer and
`npm run app:screenshots` regenerates the gallery PNGs (both delegate into
`app/`).

The explorer's **Playground** view (View → Playground) lets you fork any theme
or start from a blank template and tune every color, font, name, and tone with
live preview. It evaluates the same design invariants as `scripts/validate.js`
(both import the shared rules in `lib/`), so **Copy theme JSON** stays disabled
until every hard rule passes — paste the result into a new `themes[]` entry in
`themes/aurora-themes.json` and it clears `node scripts/validate.js` as-is.
