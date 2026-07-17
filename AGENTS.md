# Aurora Themes

A set of 14 light color themes for terminals and editors, tuned for eye-strain comfort.
`docs/design-handover/aurora-themes.json` is the single source of truth; see
`docs/design-handover/README.md` for token roles and design invariants.

## Working on themes

**Source of truth.** Colors are authored in exactly one place:
`docs/design-handover/aurora-themes.json` (palettes, tokens, ANSI mapping). Everything
under `build/` is generated — never hand-edit it, regenerate. `build/` (source
fragments) and `dist/` (packaged distributables) are both gitignored, never committed.
Doc-style rules for any doc you touch: `docs/style.md`.

**Invariants to preserve.** Every theme change must keep the design invariants (no pure
white/black, `ink` AAA ≥7:1 on `surface`, 6–8 desaturated hues, blue+orange carry the most
meaning, every token filled in for all themes). The authoritative list lives in
`docs/design-handover/README.md` ("Design rules to preserve") — read it, don't restate it.

**Standard loop for a theme change:**

1. Edit `docs/design-handover/aurora-themes.json`.
2. `node scripts/validate.js` — enforces the hard invariants; exits non-zero naming the
   failing theme + token.
3. `npm run build` (or `node scripts/generate.js`) — wipes and rewrites `build/`
   deterministically.
4. Eyeball the showcase (below) — validation can't judge hue or feel.
5. Commit the JSON only — `build/` is generated and gitignored, not committed.
   To ship the VS Code extension, `npm run package:vscode` writes a `.vsix` into
   `dist/` (also gitignored).

**Adding a 15th theme or new format.**
- *New theme*: add one entry to `themes[]` with every token filled in (nothing implicit) —
  `id`, `name`, `tone`, `fonts`, and the full `colors` block. `build/` regenerates for all
  formats automatically; add the theme to the `.dc.html` showcase and README's theme table
  by hand.
- *New tool format*: add an emitter in `scripts/generate.js` (hex helpers in `lib/colors.js`);
  terminal formats derive from the top-level `ansiMapping` block. See README's "The generator"
  and "How to use it" for the token→format mappings.

**Showcase workflow.** `docs/design-handover/*.dc.html` are CSS-variable-driven previews
(`Aurora Light Themes.dc.html` renders every theme; `Sample.dc.html` is the imported card set).
Open the file in a browser to view or screenshot all themes; they read straight from the same
color values, no build step.

## Work tracking

Managed by the `workflow` plugin. Tasks are files in `workflow/<status>/`
(draft, ready, in-progress, blocked, done) — the folder IS the status;
moving a task is `git mv`. Board view: `./workflow/status`. Repo contract:
`workflow/AGENTS.md`. Commands: `/workflow:groom`, `/workflow:work`,
`/workflow:batch-work`, `/workflow:status`, `/workflow:framework-doctor`.
