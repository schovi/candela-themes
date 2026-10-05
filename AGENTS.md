# Candela Themes

A set of 26 color themes (15 light and 11 dark) for terminals and editors, tuned for eye-strain comfort.
`themes/candela-themes.json` is the single source of truth (all palettes, tokens, ANSI
mapping). User-facing docs (rationale, install, how themes are generated) live in the root
[`README.md`](README.md); the vision-science rationale behind the invariants lives in
[`docs/vision-research.md`](docs/vision-research.md).

## Working on themes

**Source of truth.** Colors are authored in exactly one place: `themes/candela-themes.json`
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
- `ink` is **never** `#000000`; `ink` clears **7:1 (AAA)** on `bg`, `surface` and
  `lineHighlight`.
- Every syntax + diagnostic token, `faint` and `ink2` clear **4.5:1 (AA)** on every ground
  text sits on: `bg`, `surface`, `lineHighlight`, `selection`, and the translucent status
  washes (`WASH_ALPHA_HEX` over `surface`). `bg` is not always the binding one: a dark
  theme's `surface` and `lineHighlight` are lighter than `bg`.
- `ink` on `selection` clears **4.5:1 (AA)**; selection never repaints text.
- Diagnostics use **unique hexes** (`error` ≠ `num`, `warning` ≠ `kw`/`num`, `ok` ≠
  `error`); `error` leans vermillion, `ok` leans blue-green/teal, and the pair is
  luminance-separated so it reads in grayscale.
- Keep accents **desaturated** — resist neon (the load-bearing anti-fringing rule); **6–8
  hues** is taste/consistency, not a vision constraint.
- Preserve semantic roles: `kw`/`str`/`fn`/etc. mean the same thing in every theme.
- Prefer **blue + orange** as the two hues carrying the most meaning (colorblind-safe); keep
  purple tokens at least **0.05 OKLab L** away from blue ones (purple collapses into blue
  for protans/deutans).
- Keep roles ranked: `punct` is its own muted step (never equal to `ink` or `faint`), and
  `ink2` reads stronger than `faint`.
- Terminal **ANSI slots match their names**: red/green/yellow come from
  `error`/`ok`/`warning`; blue/magenta/cyan default to `fn`/`type`/`builtin` and a theme
  whose tokens sit on other hues overrides them in its own `ansi` block. Black is darker
  than white in both modes (the neutral slots are per mode).
- Fill in **all** tokens — nothing implicit — so generation never needs per-theme hacks.
- `mode` is **`"light"` or `"dark"`** on every theme — the explicit light/dark signal. The
  app's gallery filter and light/dark counts read it; never infer it from `tone`. A light
  theme's `bg` OKLab lightness is above 0.6; a dark theme's is below 0.6.

`scripts/validate.js` (via `lib/rules.js`, Node, no deps) hard-gates the above: no pure-white
`bg`/`surface`, `surface` lighter than `bg`, no pure-black `ink`, `ink` ≥ 7:1 (AAA) on every
ground, every AA floor on every ground, purple/blue lightness separation, diagnostic
hex-uniqueness, a valid `mode` (`light`/`dark`), a valid `category`, symmetric and
opposite-mode `pair` links, every token present in all themes, and ANSI slots that reference
real tokens, put red/green/yellow on matching hues, keep black darker than white, and give
bright black AA. It exits non-zero and names the failing theme + token.
It also gates **scope coverage**: every editor emitter must map the prose (`markup.*`), markup-tag
and object-key scope families, because a palette can pass every contrast rule and still render
Markdown, YAML or JSON as flat `ink` — which is how Markdown shipped unhighlighted through 1.0.
The app's preview panes are hand-colored, so only the generated files can catch it.
Warn-only judgement calls (never gate): the accent-hue count (6–8), blue/magenta/cyan ANSI
hues, APCA floors (Lc 75 for `ink`, 45 for every AA token; WCAG 2 overstates light-on-dark
contrast), OKLCH chroma above 0.17, syntax tokens that look alike for normal vision or after
protan/deutan/tritan simulation, `punct`/`ink2` role ranking, selection visibility, and the
error/ok grayscale + protan/deutan separation. It reads the JSON read-only — it reports, humans decide.

### Standard loop for a theme change

1. Edit `themes/candela-themes.json`.
2. `python3 -m json.tool themes/candela-themes.json > /dev/null` — JSON validity.
3. `node scripts/validate.js` — enforces the hard invariants; exits non-zero naming the
   failing theme + token.
4. `npm run build` (or `node scripts/generate.js`) — wipes and rewrites `build/`
   deterministically.
5. Eyeball the explorer — validation can't judge hue or feel. `npm run app` serves the
   `app/` explorer as a multi-page site (home at `/`, gallery at `/themes`, and the unified
   theme tool at `/editor`); every theme, with a **Previews** picker
   choosing which sample panes each card shows (default: terminal, TypeScript, Markdown, git;
   more languages opt-in). The **Editor** has Simple and Pro modes over one persisted draft
   and runs the same `lib/rules.js` invariants live.
6. `npm run swatches` rewrites the committed SVG previews under `docs/swatches/` after a
   palette change. `npm run swatches:png` also writes matching PNGs through the app's
   Playwright Chromium.
7. Commit the JSON and any regenerated committed docs — `build/` is generated and gitignored,
   not committed. To package
   an extension, `npm run package:vscode` writes a `.vsix` and `npm run package:intellij`
   writes a plugin `.zip`; `npm run package:zed` writes a clean extension directory.
   `npm run package:sublime` writes an installable `.sublime-package` archive.
   `npm run package:nvim` writes a plugin-manager-ready `.tar.gz` archive.
   `npm run package:bundles` writes per-tool archives for the drop-in terminal
   formats and Helix.
   All artifacts go into `dist/` (also gitignored).

### Releasing a new version

Releasing is CI-driven and main-only: dispatch the `Release` workflow
(`gh workflow run release.yml -f bump=<patch|minor|major> --ref main`) and CI
validates, creates an unpushed version commit and `vX.Y.Z` tag, builds every package
at that version, then pushes and publishes a GitHub Release with all artifacts plus
`SHA256SUMS.txt`. A failed build leaves no remote commit or tag. Nothing is built or
committed locally. Use the `release` skill (`/release`) — it decides whether a
release is warranted and which bump to pick.

Delivery is a **second, separate dispatch** — `Release` stops at the GitHub Release.
Once the tag exists, `gh workflow run publish.yml -f ref=vX.Y.Z` syncs the
Zed/Sublime dist repos immediately and queues VS Code / Open VSX / JetBrains behind
the protected `marketplace` environment — those three are irreversible, so a
maintainer approves them in the UI (D10 + D11 in `docs/decisions.md`). Pass the tag as
the `ref` **input**, not `--ref`: `--ref` picks which version of the workflow file runs.
JetBrains moderates every update, so a green job means uploaded, not live.
Full runbook: `docs/release-runbook.md`.

### Adding another theme or a new format

- *New theme*: add one entry to `themes[]` with every token filled in (nothing implicit) —
  `id`, `name` (no ordinal — ordering is presentation, see D14), `tone`, `tags` (non-empty;
  the gallery's tag filter), `mode` (`light`/`dark`), `fonts`, and the full `colors` block.
  `category` is required and is one of `tone` / `heritage` / `experiment` / `solo` — the
  gallery's main filter, one kind per theme (`solo` is the escape hatch for a theme
  belonging to no family; the gallery derives chips from the values actually present, so an
  unused category never renders). Optional `pair`: the id of its light/dark counterpart,
  which must point back and be the opposite mode. Nothing generates from `pair` — it records
  the relationship so names don't have to, and "solo" in the UI is derived from its absence,
  never stored twice. Optional `ansi`: hue-slot overrides (`blue`/`magenta`/`cyan`, rarely
  others) naming the token whose hue fits, when `fn`/`type`/`builtin` don't; the validator
  warns when a slot is off-hue. `build/` regenerates for all
  formats automatically; add the theme to README's theme table (and the gallery) by hand.
- *New tool format*: add a pure emitter module under `lib/emitters/` and wire it into `lib/emitters/index.js`
  (`FORMAT_EMITTERS`, `INSTALL_STEPS`, `emitFullFamily`; hex helpers in `lib/colors.js`);
  terminal formats derive from the top-level `ansiMapping` block plus each theme's optional
  `ansi` overrides (`resolveAnsi`). Any translucent background drawn behind text uses
  `WASH_ALPHA_HEX` from `lib/rules.js` so the validator checks what ships.

## Work tracking

Managed by the `workflow` plugin. Tasks are files in `workflow/<status>/`
(draft, ready, in-progress, blocked, done) — the folder IS the status;
moving a task is `git mv`. Board view: `./workflow/status`. Repo contract:
`workflow/AGENTS.md`. Commands: `/workflow:groom`, `/workflow:work`,
`/workflow:batch-work`, `/workflow:status`, `/workflow:framework-doctor`.
