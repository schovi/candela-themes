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

The same idea works for Sublime, Neovim (base16-style), JetBrains IDEs, Zed, Helix, etc.

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
once and all six regenerate. Hex helpers live in `lib/colors.js`; per-format
emitters live in `scripts/generate.js`, which is where new tools plug in.

---

## Design rules to preserve if you extend it

If you add a 15th theme or tweak one, keep the invariants that make the set work:

- `bg` and `surface` are **never** `#ffffff`; `surface` is slightly lighter than `bg`.
- `ink` is **never** `#000000`; `ink` on `surface` must clear **~7:1 (AAA)**.
- Keep to **6–8 accent hues**, kept **desaturated** — resist neon.
- Preserve semantic roles: `kw`/`str`/`fn`/etc. mean the same thing in every theme.
- Prefer **blue + orange** as the two hues carrying the most meaning (colorblind-safe).
- Fill in **all** tokens — nothing implicit — so generation never needs per-theme hacks.
