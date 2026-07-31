# 059 — Obsidian theme package

priority: 10

tags: emitters, packaging

## What & why

Obsidian is the highest-value tool Candela doesn't reach. It themes with plain CSS
custom properties (`--background-primary`, `--text-normal`, `--code-keyword`), scoped
by `.theme-light` / `.theme-dark`, so all 24 palettes map onto it with no design work.
Ship it as a proper Obsidian theme folder, not a snippet.

Obsidian's Appearance picker lists one theme per folder, so 24 palettes cannot be 24
entries. Decided: **one `Candela` theme** whose light and dark palettes are chosen via
the Style Settings plugin (the standard multi-palette pattern), with a working default
when Style Settings isn't installed.

## Spec

New emitter `emitObsidianTheme` in `lib/emitters.js`, producing a `build/obsidian/`
theme folder (family-level, not per-theme — mirror how `emitIntellijPluginXml` /
`vscodePackage` emit shared files inside `emitFullFamily`):

```
build/obsidian/Candela/
  manifest.json   name "Candela", version (from package.json), minAppVersion, author,
                  authorUrl = HOMEPAGE_URL, fundingUrl omitted
  theme.css
  README.md       installReadme-style install steps
```

`theme.css` structure:

1. A leading `/* @settings ... */` YAML block for Style Settings: `id: candela`, two
   `class-select` settings (`Light palette` over the 14 light themes, `Dark palette`
   over the 10 dark), each option `{ label: theme.name, value: candela-<theme.id> }`,
   `allowEmpty: false`, sensible defaults.
2. Plain `.theme-light { … }` / `.theme-dark { … }` blocks carrying the default light
   and default dark palette, so the theme works with Style Settings absent.
3. One `body.theme-light.candela-<id>` block per light theme and
   `body.theme-dark.candela-<id>` per dark theme. Light and dark ids are disjoint, so
   the mode class alone disambiguates.

Variable map (names confirmed against docs.obsidian.md Foundations/Colors and
Editor/Code):

| Obsidian | Candela |
| --- | --- |
| `--background-primary` | `bg` |
| `--background-primary-alt`, `--background-secondary` | `surface` |
| `--background-modifier-border` | `border` |
| `--text-normal` | `ink` |
| `--text-muted` | `ink2` |
| `--text-faint` | `faint` |
| `--text-accent`, `--color-accent` | `builtin` |
| `--text-selection` | `selection` |
| `--caret-color` | `cursor` |
| `--text-error` | `error` |
| `--text-success` | `ok` |
| `--code-background` | `surface` |
| `--code-normal` | `ink` |
| `--code-comment` | `faint` |
| `--code-keyword` | `kw` |
| `--code-string` | `str` |
| `--code-function` | `fn` |
| `--code-value`, `--code-important` | `num` |
| `--code-tag`, `--code-property` | `type` |
| `--code-punctuation`, `--code-operator` | `punct` |

Also set `--color-red`/`--color-orange`/`--color-yellow`/`--color-green`/`--color-blue`/
`--color-purple` from the nearest palette tokens so callouts and graph colors follow.

Packaging: new `scripts/package-obsidian.js` + `package:obsidian` npm script writing
`dist/candela-themes-obsidian-<version>.zip` containing the `Candela/` folder. Mirror
`scripts/package-zed.js` (43 lines) — same shape, zip instead of directory copy. Add it
to the `package` script chain.

**Implementation boundary**
- Owns: `lib/emitters.js` (emitter + `FORMAT_EMITTERS` entry + `INSTALL_STEPS` entry),
  `scripts/generate.js` (the `FORMAT_EMITTERS.length` assert plus a log line),
  `scripts/package-obsidian.js` (new), `package.json` scripts,
  `app/src/ExportControls.tsx` (`FORMAT_DESCRIPTIONS` entry), `README.md` (a
  `### Obsidian` section under `## Install`).
- Excluded: submitting to the Obsidian community-themes directory (needs its own public
  repo + release + PR to `obsidianmd/obsidian-releases`); groom separately.
- Excluded: bundling or vendoring Style Settings itself.
- Load-bearing: the app's single-theme export path calls `format.emit(theme, ansiMapping)`
  and zips `files` + a README — a family-level emitter must still return a sensible
  single-theme folder there (one palette, no Style Settings block is acceptable).

## Acceptance criteria

- `npm run build` writes `build/obsidian/Candela/` with `manifest.json`, `theme.css`, `README.md`.
- `theme.css` carries every one of the 24 palettes and a working default for both modes with Style Settings absent.
- Copying `build/obsidian/Candela/` into a vault's `.obsidian/themes/` makes "Candela" selectable in Settings → Appearance, and switching Obsidian between light and dark mode swaps palettes.
- With Style Settings installed, Settings → Style Settings → Candela offers a light-palette and a dark-palette dropdown, and picking one repaints the app.
- Code blocks in both Editing and Reading view use the Candela syntax tokens (spot-check one light and one dark palette).
- `npm run package:obsidian` writes `dist/candela-themes-obsidian-<version>.zip`; `npm run package` includes it.
- The explorer's `/editor` Export picker offers Obsidian and its zip installs cleanly.
- README documents the install under `## Install`.
- Green: `python3 -m json.tool themes/candela-themes.json`, `node scripts/validate.js`, `npm run build`, `cd app && npm ci && npm run build`.

## Notes

- Obsidian's Editing view (CodeMirror 6) and Reading view (Prism) highlight
  independently; the `--code-*` variables are documented to cover both but may not
  render identically. If one view diverges, note it rather than chasing per-view CSS.
