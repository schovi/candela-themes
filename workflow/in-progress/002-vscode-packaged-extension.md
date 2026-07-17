# 002 — VS Code packaged extension

priority: 20
depends: 001

## What & why

Ship all 14 Aurora themes as a real, publishable VS Code extension (daily driver). The
generator (001) gains a VS Code emitter that produces a complete extension directory: a
`package.json` contributing all 14 themes plus one theme JSON each, vsix-ready so it can be
installed locally now and pushed to the Marketplace later.

## Spec

Extend the 001 generator with a VS Code emitter writing to `dist/vscode/`:
- A single extension folder: `package.json` with `contributes.themes[]` listing all 14 (each
  `label`, `uiTheme: "vs"` since these are light themes, `path`), plus name/publisher/version/
  engines/categories metadata. Ready for `vsce package`.
- One `themes/aurora-<id>-color-theme.json` per theme: `"type": "light"`, `colors{}` (workbench
  UI keys) + `tokenColors[]` (TextMate scopes).
- **UI color mapping** (map Aurora UI tokens to workbench keys): `editor.background=surface`,
  `editor.foreground=ink`, `editorLineHighlightBackground=lineHighlight`,
  `editor.selectionBackground=selection`, `editorCursor.foreground=cursor`,
  `editorLineNumber.foreground=ink2`, panel/sidebar/tab/statusbar backgrounds from `bg`/`surface`,
  borders from `border`, errors/warnings from `error`/`warning`. Fill enough workbench keys that
  the whole UI (not just the editor pane) is themed — verify against VS Code's theme color
  reference; don't leave large surfaces default-colored.
- **Syntax mapping** = the scope table already in `docs/design-handover/README.md`
  (`kw→keyword,storage`, `str→string`, `fn→entity.name.function,support.function`,
  `num→constant.numeric,constant.language`, `type→entity.name.type,...`, `builtin→support,...`,
  `punct→punctuation,keyword.operator`, `faint→comment`).

Boundary:
- Production surface: new emitter in `scripts/` (+ any `lib/` helper), output in `dist/vscode/`.
- Contract: reuse 001's color helpers and theme-loop scaffolding — do not fork a second generator.
- Docs: extend `docs/design-handover/README.md` VS Code section to point at the real emitter/output;
  install instructions for end users live in task 006 (root README), not here.
- Exclusions: no Marketplace publishing (just vsix-ready output); no semantic-highlighting tuning
  beyond the scope table unless a theme obviously needs it.

## Acceptance criteria

- Generator writes a complete `dist/vscode/` extension: one `package.json` contributing 14 themes
  + 14 theme JSON files.
- `dist/vscode/` installs as a local extension and all 14 themes appear and switch correctly
  (spot-check a warm, a cool, and one experiment theme in a real code file).
- Each theme is `type: light`, uses `surface` for the editor background, and colors syntax per
  the README scope table.
- Workbench chrome (sidebar, tabs, status bar, panels) is themed, not left default.
- `vsce package` produces a `.vsix` without errors (or the documented equivalent if vsce isn't
  installed — at minimum the structure validates).

## Notes

`depends: 001` because it extends the shared generator scaffolding. VS Code light themes set
`uiTheme: "vs"` in the contribution and `type: "light"` in the file — get both right.
