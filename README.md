# Aurora — Light Themes for Tired Eyes

**14 light color themes** for terminals and editors, plus two dark companions.
For people who like dark mode but can't use it comfortably: prescription lenses,
astigmatism, glare sensitivity, plain eye strain. The idea is to keep the calm,
low-contrast feel of a good pastel dark theme, but on a light background — and
for the times you do want the lights off, two dark themes tuned to the same
contrast rules.

The token model and the rules to keep if you extend the set are in
[`AGENTS.md`](AGENTS.md). The vision-science behind those rules is in
[`docs/vision-research.md`](docs/vision-research.md).

## Why most light themes hurt

They're usually too bright and too saturated. Aurora follows a few rules to fix
that:

1. **Off-white backgrounds, never pure white.** Pure white glares. Soft tinted
   paper (`bg`, with panels a shade lighter in `surface`) doesn't.
2. **Dark gray text, never pure black.** Aurora inks are very dark but never
   `#000`. Dark gray on off-white just reads calmer for a lot of people.
3. **Strong contrast, not maximal.** Body text (`ink` on `surface`) clears WCAG
   AAA (7:1+). Secondary text (`ink2`) and comments (`faint`) step down but
   still clear WCAG AA (4.5:1 against `bg`, the surface terminals paint on).
4. **Low-saturation colors.** Saturated text is what causes the colored fringing
   astigmatic eyes see. Desaturating the accents is the fix.
5. **Blue and orange carry the meaning.** They stay distinct for almost all types
   of color blindness, so keywords, strings, and functions don't blur together.
6. **Same colors mean the same thing in every theme,** so switching never makes
   you relearn what you're looking at.

Each rule is explained (with sources, and where common advice gets it wrong) in
[`docs/vision-research.md`](docs/vision-research.md).

## The 16 themes

Themes 01–10 are the main palettes, from calm neutrals to stronger pastels.
11–14 are experiments, each built around one idea. 15–16 are dark themes,
extracted from iTerm favorites and tuned to the same contrast invariants.

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

What each experiment asks:

- **Graphite Mono** — what if almost everything is gray and one blue does the
  work? (fewest color fringes)
- **Tungsten** — what if we drop blue light for evening use, like a warm bulb?
  (better for sleep; blue light doesn't cause eye strain, see the research doc)
- **E-Ink Slate** — what if syntax is nearly grayscale, like a Kindle? (no glow)
- **Contrast Max** — what if sharpness, not glare, is your limit? (deep accents,
  near-white paper)

And two dark themes, for when you do want the lights off:

- **Nocturne** — Atom's classic One Dark, the palette a generation of developers
  grew up on, with accents lifted just enough to clear AA on the dark ground.
- **Borealis** — near-black charcoal under soft candy accents (teal, lilac,
  coral), like the northern lights the set is named for.

## Gallery

Each shot is one theme across a terminal, Ruby, Kotlin, Markdown, and
diagnostics, from the theme explorer (`app/`). Regenerate with
`npm run app:screenshots` (see [`docs/screenshots/README.md`](docs/screenshots/README.md)).

| | |
| --- | --- |
| **01 · Sepia Paper**<br>![Sepia Paper](docs/screenshots/aurora-sepia-paper.png) | **02 · Slate Mist**<br>![Slate Mist](docs/screenshots/aurora-slate-mist.png) |
| **03 · Sage**<br>![Sage](docs/screenshots/aurora-sage.png) | **04 · Solarized Lite**<br>![Solarized Lite](docs/screenshots/aurora-solarized-lite.png) |
| **05 · Blossom**<br>![Blossom](docs/screenshots/aurora-blossom.png) | **06 · Lagoon**<br>![Lagoon](docs/screenshots/aurora-lagoon.png) |
| **07 · Meadow**<br>![Meadow](docs/screenshots/aurora-meadow.png) | **08 · Apricot**<br>![Apricot](docs/screenshots/aurora-apricot.png) |
| **09 · Periwinkle**<br>![Periwinkle](docs/screenshots/aurora-periwinkle.png) | **10 · Ink & Coral**<br>![Ink & Coral](docs/screenshots/aurora-ink-coral.png) |
| **11 · Graphite Mono**<br>![Graphite Mono](docs/screenshots/aurora-graphite-mono.png) | **12 · Tungsten**<br>![Tungsten](docs/screenshots/aurora-tungsten.png) |
| **13 · E-Ink Slate**<br>![E-Ink Slate](docs/screenshots/aurora-eink-slate.png) | **14 · Contrast Max**<br>![Contrast Max](docs/screenshots/aurora-contrast-max.png) |
| **15 · Nocturne**<br>![Nocturne](docs/screenshots/aurora-nocturne.png) | **16 · Borealis**<br>![Borealis](docs/screenshots/aurora-borealis.png) |

## Install

Run `npm run build` to generate every theme under `build/` (`node scripts/generate.js`
works too, no dependencies). Then grab the file your tool needs from
`build/<tool>/`, or install the VS Code `.vsix` (below). `build/` and `dist/` are
generated, not committed.

Theme ids: `sepia-paper`, `slate-mist`, `sage`, `solarized-lite`, `blossom`,
`lagoon`, `meadow`, `apricot`, `periwinkle`, `ink-coral`, `graphite-mono`,
`tungsten`, `eink-slate`, `contrast-max`, `nocturne`, `borealis`.

### iTerm2

1. iTerm2 → **Settings → Profiles → Colors**.
2. **Color Presets… → Import…** and pick a file from `build/iterm2/`, e.g.
   `sepia-paper.itermcolors`.
3. Open **Color Presets…** again and select it.

### VS Code

The generated extension (all 16 themes) lives at `build/vscode/`.

- **As a `.vsix` (recommended):** `npm run package:vscode` builds and packages it
  into `dist/aurora-themes-<version>.vsix`, then **Extensions → ⋯ → Install from
  VSIX…** on that file.
- **From source:** copy `build/vscode/` into `~/.vscode/extensions/aurora-themes/`
  and reload, or open the folder in VS Code and press **F5**.

Then **Preferences: Color Theme** and pick any *Aurora NN · …* entry.

### IntelliJ / JetBrains IDEs

The theme plugin (all 16 themes) is generated at `build/intellij/`, laid out under
`src/main/resources/` for a Gradle `buildPlugin` (the Gradle wiring itself is out
of scope). Each theme ships an editor color scheme (`.icls`) and a UI theme
(`.theme.json`).

- **Editor scheme only:** **Settings → Editor → Color Scheme → ⚙ → Import
  Scheme…** and pick an `.icls` from `build/intellij/src/main/resources/themes/`.
- **Full UI theme:** build the plugin from `build/intellij/`, install it, then
  **Settings → Appearance & Behavior → Appearance → Theme** and pick an Aurora
  theme.

### Other terminals

The same ANSI palette is generated for six terminals. Pick your file and import
per that terminal's docs:

| Terminal | File |
| --- | --- |
| iTerm2 | `build/iterm2/<id>.itermcolors` |
| Alacritty | `build/alacritty/<id>.toml` |
| Kitty | `build/kitty/<id>.conf` |
| WezTerm | `build/wezterm/<id>.toml` |
| Windows Terminal | `build/windows-terminal/<id>.json` (fragment) |
| Ghostty | `build/ghostty/<id>.conf` |

### Other editors (Zed, Sublime, Neovim, Helix)

Drop-in files, all 16 themes, under `build/{zed,sublime,nvim,helix}/`. Not
published to any registry; install per that editor's docs. Zed is one
theme-family file (`build/zed/aurora.json`); the others are one file per theme.

## How themes are generated

`themes/aurora-themes.json` is the source of truth. `scripts/generate.js` (Node,
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

Every entry declares `mode` (`"light"` or `"dark"`) and a non-empty `tags` array —
both required and validated (`node scripts/validate.js` fails a theme missing either).
`mode` drives the gallery's light/dark filter; `tags` drive its tag filter, where each
theme carries the atomic tags behind its `tone` label (so `pastel-cool` is `["pastel",
"cool"]` and selecting `cool` matches it alongside `dark / cool`).

Build from the repo root:

```sh
npm run build   # or: node scripts/generate.js
```

It wipes and rewrites `build/`, emitting one file per theme per tool at
`build/<tool>/<theme-id>.<ext>`. Output is deterministic (re-running gives
byte-identical files). Hex helpers live in `lib/colors.js`; per-format emitters
live in `scripts/generate.js`, which is where new tools plug in.

The tables below are the token → format mappings each emitter uses.

### Terminal (ANSI 16-color)

The top-level `ansiMapping` block maps tokens to the 16 ANSI slots, plus
`background = bg`, `foreground = ink`, `cursor = cursor`,
`selectionBackground = selection`. It's one sensible default (e.g. `yellow → kw`,
`red → num`); change it once and all six terminal formats regenerate.

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

The VS Code emitter writes a complete, vsix-ready extension at `build/vscode/`:
one `package.json` contributing all 16 themes and one
`themes/aurora-<id>-color-theme.json` per theme (`"type": "light"`, workbench
`colors{}` + `tokenColors[]`). The whole workbench is themed (activity bar, side
bar, tabs, status bar, panels, integrated terminal), not just the editor pane.
`package.json` carries full Marketplace metadata (placeholder `CHANGEME` URLs
until a real repo exists), and the emitter also drops a bundled `README.md`, a
`.vscodeignore`, and a copy of the root MIT `LICENSE` so packaging is
warning-free (no `icon` yet, needs a 128px PNG). Sublime reuses the same scope
table, emitting `build/sublime/aurora-<id>.sublime-color-scheme`.

### JetBrains / IntelliJ

`build/intellij/` is laid out under `src/main/resources/` for a Gradle
`buildPlugin`. Per theme: an editor color scheme `.icls` (XML) and a UI theme
`.theme.json`, plus one `META-INF/plugin.xml` registering all 16 as
`themeProvider` extensions. Two hex conventions: **`.icls` drops the leading `#`**
(`value="9a5b2c"`); **`.theme.json` keeps it** (`"#9a5b2c"`).

`.icls` general editor colors and the editor background/foreground:

| Aurora token | `.icls` key | Section |
| --- | --- | --- |
| `surface` | `TEXT` → `BACKGROUND` | `<attributes>` |
| `ink` | `TEXT` → `FOREGROUND` | `<attributes>` |
| `cursor` | `CARET_COLOR` | `<colors>` |
| `lineHighlight` | `CARET_ROW_COLOR` | `<colors>` |
| `selection` | `SELECTION_BACKGROUND` | `<colors>` |
| `ink2` | `LINE_NUMBERS_COLOR` | `<colors>` |
| `border` | `GUTTER_BACKGROUND`, `INDENT_GUIDE` | `<colors>` |

`.icls` syntax attributes (`FOREGROUND` per key):

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

- **Zed** → `build/zed/aurora.json`, one theme *family* file (`$schema` v0.2.0,
  `themes[]`), each entry `appearance: "light"`. UI keys map
  `editor.background = surface`, `editor.foreground = ink`,
  `editor.active_line.background = lineHighlight`,
  `text/text.muted/text.placeholder = ink/ink2/faint`, `border = border`,
  `players[0] = {cursor, selection}`; `style.syntax{}` maps `keyword→kw`,
  `string→str`, `function→fn`, `number/constant→num`, `type/constructor→type`,
  `variable.special/attribute→builtin`, `operator/punctuation→punct`,
  `comment→faint`; `terminal.ansi.*` reuses `ansiMapping`.
- **Neovim** → `build/nvim/aurora-<id>.lua`, a self-contained Lua colorscheme
  (loads with `:colorscheme aurora-<id>`, no plugins). Sets
  `vim.o.background = 'light'`, legacy highlight groups (`Keyword→kw`,
  `String→str`, `Function→fn`, `Number/Constant→num`, `Type→type`,
  `PreProc/Special→builtin`, `Operator/Delimiter→punct`, `Comment→faint` italic,
  `Normal = ink on bg`, `Visual = selection`, `CursorLine = lineHighlight`).
  Neovim links Treesitter groups to these by default. Plus the 16
  `vim.g.terminal_color_N` slots from `ansiMapping`.
- **Helix** → `build/helix/aurora-<id>.toml`, a `[palette]` table of every token
  with top-level scope keys: `ui.background = bg`, `ui.text = ink`,
  `ui.cursor = {fg=bg, bg=cursor}`, `ui.selection = {bg=selection}`,
  `ui.cursorline = {bg=lineHighlight}`, `ui.linenr = ink2`; syntax `keyword→kw`,
  `string→str`, `function→fn`, `constant[.numeric]→num`, `type→type`,
  `variable.builtin/label→builtin`, `punctuation/operator→punct`, `comment→faint`,
  `diagnostic.error/warning → error/warning`.

## Contributing / extending

`themes/aurora-themes.json` is the single source of truth. Run `npm run build` to
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

The explorer is a static multi-page site (built by Vite, no SPA/router): the
home page at `/` pitches Aurora and indexes every theme, the gallery at
`/themes` shows each theme across sample panes (with a filter bar — fulltext
search over name/tone/tags/fonts, a mode select, and multi-select tag chips — and a per-theme anchor
so any theme is directly linkable, e.g. `/themes#lagoon`), and the **Lab** at
`/lab` holds the two theme-building tools:

- **Theme Editor** forks any theme or starts blank, with hex plus H/S/L sliders
  per token and live preview. The lightness track shades the range that still
  clears each token's contrast floor.
- **Theme Builder** is the guided path: pick a background mood and darkness,
  choose accent hues on a wheel, set the three diagnostic hues, and it derives a
  full valid palette for you.

Both run the same invariants as `scripts/validate.js` (shared code in `lib/`), so
**Copy theme JSON** stays disabled until every hard rule passes. Paste the result
into a new `themes[]` entry and it clears `node scripts/validate.js` as-is.
