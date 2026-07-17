# Aurora Themes

A set of 14 light color themes for terminals and editors, tuned for eye-strain comfort.
`themes/aurora-themes.json` is the single source of truth (all palettes, tokens, ANSI
mapping). User-facing docs (rationale, install, how themes are generated) live in the root
[`README.md`](README.md); the vision-science rationale behind the invariants lives in
[`docs/vision-research.md`](docs/vision-research.md).

## Working on themes

**Source of truth.** Colors are authored in exactly one place: `themes/aurora-themes.json`
(palettes, tokens, ANSI mapping). Everything under `build/` is generated — never hand-edit
it, regenerate. `build/` (source fragments) and `dist/` (packaged distributables) are both
gitignored, never committed. Doc-style rules for any doc you touch: `docs/style.md`.

### Token reference

Every theme defines the **same** tokens, so anything generated from the JSON is consistent.

**UI**

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

**Syntax**

| Token | Role |
| --- | --- |
| `kw` | Keywords, storage (`class`/`def`/`fun`/`val`) |
| `str` | Strings, char literals |
| `fn` | Function / method names, links |
| `num` | Numbers, constants |
| `type` | Types, classes, namespaces |
| `builtin` | Built-ins, symbols, inline code (the "cyan/accent" role) |
| `punct` | Punctuation, operators, brackets |

**Diagnostics**

| Token | Role |
| --- | --- |
| `error` | Errors / deletions |
| `warning` | Warnings |
| `ok` | Success / additions (usually equals `str`) |

`error` / `warning` / `ok` are derived to fit each palette; glance at them (the app
explorer's diagnostics pane) before shipping a generated theme.

### Design rules to preserve

Keep these invariants on every theme change. The vision-science behind each rule (and where
the original rationale was wrong) lives in `docs/vision-research.md` — read it rather than
re-deriving the numbers.

- `bg` and `surface` are **never** `#ffffff`; `surface` is slightly lighter than `bg`.
- `ink` is **never** `#000000`; `ink` on `surface` must clear **~7:1 (AAA)**.
- Every syntax + diagnostic token, and `faint`, clears **4.5:1 (AA) against `bg`** (the
  binding surface — terminals paint on it).
- `ink` on `selection` clears **4.5:1 (AA)**; selection never repaints text.
- Diagnostics use **unique hexes** (`error` ≠ `num`, `warning` ≠ `kw`/`num`, `ok` ≠
  `error`); `error` leans vermillion, `ok` leans blue-green/teal, and the pair is
  luminance-separated so it reads in grayscale.
- Keep accents **desaturated** — resist neon (the load-bearing anti-fringing rule); **6–8
  hues** is taste/consistency, not a vision constraint.
- Preserve semantic roles: `kw`/`str`/`fn`/etc. mean the same thing in every theme.
- Prefer **blue + orange** as the two hues carrying the most meaning (colorblind-safe); keep
  purple tokens at a different lightness than blue ones (purple collapses into blue for
  protans/deutans).
- Fill in **all** tokens — nothing implicit — so generation never needs per-theme hacks.

`scripts/validate.js` (via `lib/rules.js`, Node, no deps) hard-gates the above: no pure-white
`bg`/`surface`, `surface` lighter than `bg`, no pure-black `ink`, `ink`/`surface` ≥ 7:1 (AAA),
every AA floor, diagnostic hex-uniqueness, every token present in all 14 themes, and ANSI
mappings that reference real tokens. It exits non-zero and names the failing theme + token.
Warn-only judgement calls (never gate): the accent-hue count (6–8) and the error/ok grayscale +
protan/deutan separation. It reads the JSON read-only — it reports, humans decide.

### Standard loop for a theme change

1. Edit `themes/aurora-themes.json`.
2. `python3 -m json.tool themes/aurora-themes.json > /dev/null` — JSON validity.
3. `node scripts/validate.js` — enforces the hard invariants; exits non-zero naming the
   failing theme + token.
4. `npm run build` (or `node scripts/generate.js`) — wipes and rewrites `build/`
   deterministically.
5. Eyeball the explorer — validation can't judge hue or feel. `npm run app` serves the
   `app/` explorer (every theme, all sample panes including diagnostics); its **Playground**
   view runs the same `lib/rules.js` invariants live.
6. Commit the JSON only — `build/` is generated and gitignored, not committed. To ship the
   VS Code extension, `npm run package:vscode` writes a `.vsix` into `dist/` (also gitignored).

### Adding a 15th theme or new format

- *New theme*: add one entry to `themes[]` with every token filled in (nothing implicit) —
  `id`, `name`, `tone`, `fonts`, and the full `colors` block. `build/` regenerates for all
  formats automatically; add the theme to README's theme table (and the gallery) by hand.
- *New tool format*: add an emitter in `scripts/generate.js` (hex helpers in `lib/colors.js`);
  terminal formats derive from the top-level `ansiMapping` block. See README's "How themes are
  generated" for the token→format mappings.

## Work tracking

Managed by the `workflow` plugin. Tasks are files in `workflow/<status>/`
(draft, ready, in-progress, blocked, done) — the folder IS the status;
moving a task is `git mv`. Board view: `./workflow/status`. Repo contract:
`workflow/AGENTS.md`. Commands: `/workflow:groom`, `/workflow:work`,
`/workflow:batch-work`, `/workflow:status`, `/workflow:framework-doctor`.
