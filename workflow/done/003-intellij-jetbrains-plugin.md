# 003 — IntelliJ/JetBrains packaged plugin

done: 2026-07-17
depends: 001

## What & why

Ship all 14 Aurora themes for JetBrains IDEs (IntelliJ daily driver) as a packaged plugin.
The generator (001) gains a JetBrains emitter producing editor color schemes plus UI themes for
all 14, structured as a plugin that can be installed now and published to the JetBrains
Marketplace later.

## Spec

Extend the 001 generator with a JetBrains emitter writing to `dist/intellij/`:
- **Editor color scheme** `.icls` (XML) per theme: `<scheme>` with `<colors>` (general editor
  colors — background=`surface`, foreground=`ink`, caret=`cursor`, selection=`selection`,
  line number=`ink2`, caret row=`lineHighlight`, gutter/indent from `border`) and
  `<attributes>` mapping syntax `TextAttributes` to Aurora syntax tokens
  (`DEFAULT_KEYWORD→kw`, `DEFAULT_STRING→str`, `DEFAULT_FUNCTION_DECLARATION→fn`,
  `DEFAULT_NUMBER→num`, `DEFAULT_CLASS_NAME→type`, `DEFAULT_CONSTANT/DEFAULT_METADATA→builtin`,
  `DEFAULT_OPERATION_SIGN/DEFAULT_BRACES/DEFAULT_DOT→punct`, `DEFAULT_LINE_COMMENT/DEFAULT_BLOCK_COMMENT→faint`,
  errors/warnings from `error`/`warning`). Verify exact attribute keys against a real exported
  `.icls` — the XML schema is the fiddly part here.
- **UI theme** `.theme.json` per theme referencing its `.icls`, with a `ui{}` block for the IDE
  frame (backgrounds from `bg`/`surface`, borders from `border`, text from `ink`). Keep the UI
  block modest but coherent — don't leave the whole frame default.
- **Plugin structure**: `META-INF/plugin.xml` declaring all 14 themes as `themeProvider`
  extensions, plus the metadata a JetBrains plugin needs. Gradle/`vsce`-equivalent packaging is
  out of scope — ship the plugin source layout that a `buildPlugin` would consume.

Boundary:
- Production surface: new emitter in `scripts/` (+ `lib/` helpers), output in `dist/intellij/`.
- Contract: reuse 001's scaffolding and color helpers. iTerm2 float components and IntelliJ hex
  differ — IntelliJ `.icls` uses hex without `#` in some attributes; verify.
- Docs: extend `docs/design-handover/README.md` with the JetBrains attribute mapping table;
  end-user install instructions live in task 006.
- Exclusions: no Marketplace publish, no Gradle build wiring, no per-language plugin-specific
  attributes beyond the common `DEFAULT_*` set unless a theme clearly needs it.

## Acceptance criteria

- Generator writes `dist/intellij/` with a `.icls` + `.theme.json` per theme (14 each) and a
  `META-INF/plugin.xml` registering all 14.
- Importing one generated `.icls` into IntelliJ (Settings → Editor → Color Scheme → Import) applies
  correctly: background=`surface`, keywords/strings/functions/comments colored per the mapping
  (spot-check a warm, a cool, and one experiment theme in real code).
- The `.theme.json` themes load as IDE UI themes with a coherent (non-default) frame.
- XML is well-formed for all 14 `.icls` files.

## Notes

`depends: 001` — extends the shared generator. The `.icls` XML attribute names are the main
unknown; confirm against an exported scheme from a current IntelliJ before finalizing the mapping.
