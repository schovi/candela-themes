# Aurora — Light Themes for Tired Eyes

A set of **14 light color themes** for terminals and editors, designed for people who
prefer dark mode but can't comfortably use it — prescription lenses, astigmatism,
glare sensitivity, general eye strain. The goal: keep the calm, low-contrast *feel* of a
good pastel dark theme, but on light backgrounds that don't fight your eyes.

Files in this project:

| File | What it is |
| --- | --- |
| `Aurora Light Themes.dc.html` | The visual showcase — every theme rendered across a terminal, Ruby, Kotlin, and Markdown. |
| `Sample.dc.html` | The reusable sample card set the showcase imports (driven purely by CSS variables). |
| `aurora-themes.json` | **The single source of truth.** All 14 palettes + tokens + ANSI mapping. Generate tool themes from this. |
| `README.md` | This file. |

---

## Why light themes hurt (and how we fixed it)

The usual complaint isn't "light is bad" — it's that most light themes are built wrong.
Aurora is designed around a handful of vision-comfort principles:

1. **No pure white backgrounds.** Pure `#ffffff` at full brightness causes *halation* —
   the glow that makes text edges bleed, which is dramatically worse with astigmatism.
   Every Aurora background is a soft off-white / tinted paper (`bg`), with panels a touch
   lighter (`surface`). Never `#fff`.

2. **No pure black text.** Maximum black-on-white contrast (21:1) is actually *too* harsh
   and increases shimmer. Aurora inks are very dark but never `#000` — typically around
   `#22–34` lightness.

3. **High but not maximal body contrast.** Default text (`ink` on `surface`) clears
   **WCAG AAA (~7:1 and up)** so it's genuinely readable, without pushing to the painful
   extreme. Secondary text (`ink2`) and comments (`faint`) step down in a deliberate,
   readable hierarchy.

4. **Few, low-saturation colors.** Each theme uses **6–8 desaturated accent hues**, not a
   rainbow. Fewer competing highly-saturated colors means fewer chromatic-aberration
   fringes — the colored halos astigmatic eyes see around saturated text.

5. **Blue / orange as the primary hue anchors.** Blue and orange stay distinguishable
   across almost all color-vision types, so keywords vs. strings vs. functions remain
   legible even for colorblind readers.

6. **Consistent semantic roles.** The same token always means the same thing across all 14
   themes (see the token table below), so switching themes never re-teaches your eyes.

---

## The 14 themes

Themes 01–10 are the "production" palettes, from calm neutrals to stronger pastels.
11–14 are **experiments**, each built around a single constraint rather than just a new color.

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

The four experiments answer different questions:
- **Graphite Mono** — what if almost everything is gray and *one* blue does all the work? (fewest color fringes)
- **Tungsten** — what if we strip short-wavelength blue for evening use, like a warm bulb?
- **E-Ink Slate** — what if syntax is nearly grayscale, like reading on a Kindle? (no glow, no vibration)
- **Contrast Max** — what if sharpness, not glare, is your limiter? (deep saturated accents, near-white paper)

---

## Token reference

Every theme in `aurora-themes.json` defines the **same** tokens, so anything generated from
it is consistent.

### UI
| Token | Role |
| --- | --- |
| `bg` | Editor / terminal background |
| `surface` | Panels, cards, code area (slightly lighter than `bg`) |
| `border` | Dividers, borders, inactive UI |
| `ink` | Primary text / default foreground |
| `ink2` | Secondary text, line numbers |
| `faint` | Comments, disabled text, placeholder |
| `selection` | Selection background |
| `cursor` | Caret color |
| `lineHighlight` | Active-line background |

### Syntax
| Token | Role |
| --- | --- |
| `kw` | Keywords, storage (`class`/`def`/`fun`/`val`) |
| `str` | Strings, char literals |
| `fn` | Function / method names, links |
| `num` | Numbers, constants |
| `type` | Types, classes, namespaces |
| `builtin` | Built-ins, symbols, inline code (the "cyan/accent" role) |
| `punct` | Punctuation, operators, brackets |

### Diagnostics
| Token | Role |
| --- | --- |
| `error` | Errors / deletions |
| `warning` | Warnings |
| `ok` | Success / additions (usually equals `str`) |

> Note: `error` / `warning` / `ok` were derived to fit each palette and aren't shown in the
> visual previews — glance at them before shipping a generated theme.

---

## How to use it (generating tool themes)

`aurora-themes.json` is the source of truth. A generator reads a theme's `colors` block and
emits whatever format a tool needs. Structure:

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

### Terminal (ANSI 16-color)

The top-level `ansiMapping` block maps tokens → the 16 ANSI slots, plus:
`background = bg`, `foreground = ink`, `cursor = cursor`, `selectionBackground = selection`.

Applies to **iTerm2, Alacritty, Kitty, Windows Terminal, GNOME Terminal, WezTerm**, etc.
The mapping is one sensible default (e.g. `yellow → kw`, `red → num`); if you prefer
`red → error`, change it once in that one block and every terminal theme regenerates.

### Editors (VS Code, etc.)

Map UI tokens to the editor's UI keys (`editor.background = surface`,
`editor.foreground = ink`, `editorLineHighlightBackground = lineHighlight`, …) and syntax
tokens to `tokenColors` scopes:

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

JetBrains IDEs, Zed, Sublime Text, Neovim, and Helix each get their own generated
output — see "JetBrains / IntelliJ" below and "Extra editors" for the exact paths and mappings.

### JetBrains / IntelliJ

`scripts/generate.js` emits a packaged JetBrains theme plugin at `dist/intellij/`,
laid out under `src/main/resources/` so a Gradle `buildPlugin` can consume it
(Gradle wiring itself is out of scope). Per theme it writes an **editor color
scheme** `.icls` (XML) and a **UI theme** `.theme.json` under `themes/`, plus one
`META-INF/plugin.xml` registering all 14 as `themeProvider` extensions.

Two hex conventions: **`.icls` drops the leading `#`** (`value="9a5b2c"`);
**`.theme.json` keeps it** (`"#9a5b2c"`).

The `.icls` general editor colors (`<colors>` block) and the editor background /
foreground (the `TEXT` attribute):

| Aurora token | `.icls` key | Section |
| --- | --- | --- |
| `surface` | `TEXT` → `BACKGROUND` | `<attributes>` |
| `ink` | `TEXT` → `FOREGROUND` | `<attributes>` |
| `cursor` | `CARET_COLOR` | `<colors>` |
| `lineHighlight` | `CARET_ROW_COLOR` | `<colors>` |
| `selection` | `SELECTION_BACKGROUND` | `<colors>` |
| `ink2` | `LINE_NUMBERS_COLOR` | `<colors>` |
| `border` | `GUTTER_BACKGROUND`, `INDENT_GUIDE` | `<colors>` |

The `.icls` syntax attributes (`<attributes>` block, `FOREGROUND` per key):

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
`border`, text from `ink`/`ink2`/`faint`, accents from `fn`) so the IDE frame is
coherent rather than default. End-user install instructions live in the root README.

`scripts/generate.js` emits a complete, vsix-ready VS Code extension at
`dist/vscode/`: one `package.json` contributing all 14 themes (each `uiTheme: "vs"`
since these are light) and one `themes/aurora-<id>-color-theme.json` per theme
(`"type": "light"`, workbench `colors{}` + `tokenColors[]` from the scope table
above). The whole workbench is themed (activity bar, side bar, tabs, status bar,
panels, integrated terminal — the terminal ANSI slots reuse the `ansiMapping`
block, so editor and terminal stay in sync), not just the editor pane. Package it
with `vsce package` from `dist/vscode/`. End-user install instructions live in the
root README.

### Extra editors (Zed, Sublime, Neovim, Helix)

`scripts/generate.js` also emits Aurora for four more editors, all 14 themes each,
reusing the same color helpers and syntax scope roles (no duplicated color/ANSI logic).

**Zed** → `dist/zed/aurora.json` — a single theme *family* file (`$schema` v0.2.0,
`themes[]`), each entry `appearance: "light"` with a `style{}` block. Editor UI keys map
`editor.background = surface`, `editor.foreground = ink`, `editor.active_line.background
= lineHighlight`, `text/text.muted/text.placeholder = ink/ink2/faint`, `border = border`,
and `players[0] = {cursor, selection}`. `style.syntax{}` maps `keyword→kw`, `string→str`,
`function→fn`, `number/constant→num`, `type/constructor→type`, `variable.special/attribute→builtin`,
`operator/punctuation→punct`, `comment→faint`. The `terminal.ansi.*` keys reuse the
`ansiMapping` block, so Zed's terminal matches the terminal themes.

**Sublime Text** → `dist/sublime/aurora-<id>.sublime-color-scheme` — JSON with `variables`
(every Aurora token as a `#rrggbb`), `globals` (`background = surface`, `foreground = ink`,
`caret = cursor`, `selection = selection`, `line_highlight = lineHighlight`, gutter from
`bg`/`ink2`), and `rules[]` mapping the **same TextMate scope table as VS Code** (above) to
`var(<token>)`.

**Neovim** → `dist/nvim/aurora-<id>.lua` — a self-contained Lua colorscheme.
Chosen over a base16 YAML: the Lua file drops into `runtimepath` and loads with
`:colorscheme aurora-<id>` and **zero plugins**, whereas a base16 YAML needs the base16
builder/plugin to apply at all. It sets `vim.o.background = 'light'`, legacy highlight groups
(`Keyword→kw`, `String→str`, `Function→fn`, `Number/Constant→num`, `Type→type`,
`PreProc/Special→builtin`, `Operator/Delimiter→punct`, `Comment→faint` italic, `Normal =
ink on bg`, `Visual = selection`, `CursorLine = lineHighlight`, …) — Neovim links Treesitter
groups to these by default — plus the 16 `vim.g.terminal_color_N` slots from `ansiMapping`.

**Helix** → `dist/helix/aurora-<id>.toml` — a `[palette]` table carrying every Aurora token
as hex, with top-level scope keys referencing palette names: `ui.background = bg`,
`ui.text = ink`, `ui.cursor = {fg=bg, bg=cursor}`, `ui.selection = {bg=selection}`,
`ui.cursorline = {bg=lineHighlight}`, `ui.linenr = ink2`; syntax `keyword→kw`, `string→str`,
`function→fn`, `constant[.numeric]→num`, `type→type`, `variable.builtin/label→builtin`,
`punctuation/operator→punct`, `comment→faint`, and `diagnostic.error/warning → error/warning`.

None of these are published to a marketplace/registry — they are drop-in files; install
instructions live in the root README.

### The generator

`scripts/generate.js` is the real generator (Node, no dependencies). Run it from the repo root:

```sh
node scripts/generate.js
```

It reads this JSON, wipes and rewrites `dist/`, and emits one file per theme per
tool at `dist/<tool>/<theme-id>.<ext>`. Output is deterministic — re-running
produces byte-identical files, so `dist/` is committed and users can grab a
theme without running Node.

Terminal formats generated today (all 14 themes each): **iTerm2**
(`.itermcolors`), **Alacritty** (`.toml`), **Kitty** (`.conf`), **WezTerm**
(`.toml`), **Windows Terminal** (JSON fragment), **Ghostty** (`.conf`). Every
terminal format is driven by the `ansiMapping` block above — change the mapping
once and all six regenerate. A VS Code extension is generated too, at
`dist/vscode/` (see "Editors" above), a JetBrains plugin at `dist/intellij/`, and
Zed / Sublime / Neovim / Helix output under `dist/{zed,sublime,nvim,helix}/`
(see "Extra editors" above). Hex helpers live in `lib/colors.js`;
per-format emitters live in `scripts/generate.js`, which is where new tools
plug in.

---

## Design rules to preserve if you extend it

If you add a 15th theme or tweak one, keep the invariants that make the set work:

- `bg` and `surface` are **never** `#ffffff`; `surface` is slightly lighter than `bg`.
- `ink` is **never** `#000000`; `ink` on `surface` must clear **~7:1 (AAA)**.
- Keep to **6–8 accent hues**, kept **desaturated** — resist neon.
- Preserve semantic roles: `kw`/`str`/`fn`/etc. mean the same thing in every theme.
- Prefer **blue + orange** as the two hues carrying the most meaning (colorblind-safe).
- Fill in **all** tokens — nothing implicit — so generation never needs per-theme hacks.

`scripts/validate.js` (Node, no dependencies) enforces the hard invariants above —
no pure-white `bg`/`surface`, `surface` lighter than `bg`, no pure-black `ink`,
`ink` on `surface` ≥ 7:1 (AAA), every token present in all 14 themes, and ANSI
mappings that reference real tokens. Run `node scripts/validate.js`; it exits
non-zero and names the failing theme + token on any violation. The accent-hue count
(6–8) is a warn-only judgement call, not a hard gate. It reads the JSON read-only and
never edits colors — it reports, humans decide.
