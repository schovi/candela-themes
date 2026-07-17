# 001 — Generator core + terminal formats

done: 2026-07-17

## What & why

There is no generator yet — `aurora-themes.json` is the source of truth but nothing
consumes it. This task builds the Node (no-deps) generator pipeline that every other
tool-theme task extends, and ships the first consumer: terminal color schemes for all
14 themes, iTerm2 first (daily driver). Everything downstream (VS Code, IntelliJ, extra
formats) reuses the scaffolding this task establishes.

## Spec

Runtime: Node.js, zero runtime dependencies. One entry point, `node scripts/generate.js`,
reads `docs/design-handover/aurora-themes.json` and writes `dist/<tool>/<theme-id>.<ext>`.
Wipe+rewrite `dist/` on each run so output is deterministic and diffable.

Establish shared scaffolding (this is the boundary other tasks build on):
- `scripts/generate.js` — loads the JSON, loops themes, dispatches to per-format emitters.
- `lib/colors.js` — hex parsing/normalization helpers: `#rrggbb` → `{r,g,b}` (0–255),
  → 0–1 floats (iTerm2 needs these), passthrough hex for text formats. One place, reused everywhere.
- `dist/` layout: one subdir per tool. Committed so users can grab files without running Node.

Terminal emitters, all driven by the top-level `ansiMapping` block
(`background=bg, foreground=ink, cursor=cursor, selectionBackground=selection`, 16 ANSI
slots from `normal`/`bright`):
- **iTerm2** `.itermcolors` — XML plist, colors as `redComponent`/`greenComponent`/`blueComponent`
  floats 0–1, keys `Ansi 0 Color`…`Ansi 15 Color` + `Background/Foreground/Cursor/Selection Color`.
  This is the one fiddly format (plist + float components) — verify against a real exported
  `.itermcolors` before shipping.
- **Alacritty** `.toml`, **Kitty** `.conf`, **WezTerm** `.toml`, **Windows Terminal** color-scheme
  JSON fragment, **Ghostty** `.conf`. These are all flat hex key/value — trivial once the ANSI
  map is resolved.

Boundary:
- Production surface: `scripts/`, `lib/`, `dist/` (new top-level dirs).
- Docs to update: `docs/design-handover/README.md` (the "How to use it / generator" section
  currently shows a pseudo-sketch — point it at the real `scripts/generate.js`). Verify whether
  the root has a README yet; it does not — root README is task 006, don't create it here.
- Load-bearing contract: the token set and `ansiMapping` in `aurora-themes.json`. Do not change
  the JSON schema here; only consume it.
- Exclusions: no editor formats (002/003/004), no packaging, no npm publish.

## Acceptance criteria

- `node scripts/generate.js` runs with a stock Node install (no `npm install`) and exits 0.
- `dist/` contains all 14 themes for every terminal format listed above (iTerm2, Alacritty,
  Kitty, WezTerm, Windows Terminal, Ghostty).
- Generated iTerm2 `.itermcolors` imports cleanly into iTerm2 and the ANSI/background/foreground
  colors match the theme's JSON values (spot-check one warm + one cool theme).
- Re-running the generator produces byte-identical output (deterministic).
- `python3 -m json.tool docs/design-handover/aurora-themes.json > /dev/null` still passes.

## Notes

The README already documents the token → ANSI mapping and a JS generator sketch — this task
turns that sketch into the real thing. Keep the mapping logic reading from the JSON's
`ansiMapping`, not hardcoded, so changing the mapping regenerates every terminal theme.
