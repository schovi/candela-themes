# 062 — Xcode colorscheme format

done: 2026-08-12

tags: emitters, packaging

## What & why

Xcode is the one major IDE with no Candela theme, and its format is a plain XML plist
that drops into a user directory — no packaging, no signing, no marketplace. Cheap
coverage for every Apple-platform developer.

## Spec

New emitter `emitXcodeTheme` in `lib/emitters/` (its own module), one file per theme:
`build/xcode/Candela <Name>.xccolortheme` (Xcode shows the filename in the theme
picker, so the display name has to live there).

XML plist with the standard Xcode 11+ keys:

- `DVTSourceTextBackground` → `bg`
- `DVTSourceTextInsertionPointColor` → `cursor`
- `DVTSourceTextSelectionColor` → `selection`
- `DVTSourceTextCurrentLineHighlightColor` → `lineHighlight`
- `DVTSourceTextInvisiblesColor` → `faint`
- `DVTSourceTextBlockDimBackgroundColor` → `surface`
- `DVTConsoleTextColor` / `DVTConsoleDebuggerInputTextColor` → `ink`
- `DVTConsoleErrorTextColor` → `error`
- `DVTMarkupTextNormalColor` → `ink`, `DVTMarkupTextLinkColor` → `fn`
- `DVTSourceTextSyntaxColors` dict, mapping:

| Xcode syntax key | Token |
| --- | --- |
| `xcode.syntax.plain` | `ink` |
| `xcode.syntax.comment`, `xcode.syntax.comment.doc`, `xcode.syntax.comment.doc.keyword` | `faint` |
| `xcode.syntax.keyword` | `kw` |
| `xcode.syntax.string`, `xcode.syntax.character` | `str` |
| `xcode.syntax.number` | `num` |
| `xcode.syntax.identifier.function`, `xcode.syntax.identifier.function.system` | `fn` |
| `xcode.syntax.identifier.type`, `xcode.syntax.identifier.class`, `xcode.syntax.identifier.class.system` | `type` |
| `xcode.syntax.identifier.variable`, `xcode.syntax.identifier.constant`, `*.system` variants | `builtin` |
| `xcode.syntax.identifier.macro`, `xcode.syntax.preprocessor` | `builtin` |
| `xcode.syntax.attribute` | `punct` |
| `xcode.syntax.url` | `fn` |
| `xcode.syntax.mark` | `ink2` |

Colors are space-separated float RGBA strings (`"0.512 0.423 0.157 1"`), not hex —
`hexToFloat` in `lib/colors.js` already returns 0..1 components, so format as
`` `${r} ${g} ${b} 1` `` with fixed precision (3 decimals) for deterministic output.

Font keys (`DVTSourceTextSyntaxFonts`) are **out of scope**: omit them so Xcode keeps
the user's chosen font rather than forcing one.

Emit the plist by hand-building the XML string, the way `emitIterm` already builds its
plist — no plist dependency.

Packaging: drop-in, so a `bundles[]` entry in `scripts/package-bundles.js`
(`tool: 'xcode'`, `extension: '.xccolortheme'`).

**Implementation boundary**
- Owns: `lib/emitters/` (new module + `FORMAT_EMITTERS`/`INSTALL_STEPS` entries in `index.js`),
  `scripts/generate.js` (the `FORMAT_EMITTERS.length` assert + a log line), `scripts/package-bundles.js`,
  `app/src/ExportControls.tsx`, `README.md` (`### Xcode` section under `## Install`).
- Load-bearing: `package-bundles.js` filters by extension and asserts one file per
  theme; filenames containing spaces must survive the `tar`/`zip` argv path (verify, and
  fall back to `candela-<id>.xccolortheme` if it doesn't — Xcode then shows the id).
- Excluded: font settings, and the legacy `.dvtcolortheme` format.

## Acceptance criteria

- `npm run build` writes 26 `build/xcode/*.xccolortheme` files, each valid XML (`plutil -lint` passes).
- Copying them into `~/Library/Developer/Xcode/UserData/FontAndColorThemes/` makes every Candela theme appear in Xcode → Settings → Themes, and selecting one repaints the editor and console.
- A spot-checked Swift file shows comments, keywords, strings, numbers, functions and types in their Candela tokens; the user's font is unchanged.
- `npm run package:bundles` writes `dist/candela-themes-xcode-<version>.tar.gz` with 26 theme files plus `README.txt`.
- The explorer's `/editor` Export picker offers Xcode and its zip installs cleanly.
- README documents the install under `## Install`.
- Green: `node scripts/validate.js`, `npm run build`, `cd app && npm ci && npm run build`.
