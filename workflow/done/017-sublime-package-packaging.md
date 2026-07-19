# 017 — Sublime Text package packaging

done: 2026-07-19

## What & why

Sublime installs themes/color schemes as **packages** (a `.sublime-package` is just
a zip Sublime loads directly; Package Control is the registry). Today Candela emits
loose `build/sublime/candela-<id>.sublime-color-scheme` files with no package wrapper.
Mirror 012 for VS Code: assemble a proper Sublime package and a packaging script that
produces an installable `.sublime-package` in `dist/`, ready to publish later.

## Spec

Follow the 012 pattern (packaging script + `package:<tool>` npm script + metadata +
docs), applied to Sublime.

### Package layout (emitted into `build/sublime/`)
- Extend the Sublime emitter in `scripts/generate.js` so `build/sublime/` is a valid
  package directory: the existing 14 `.sublime-color-scheme` files plus the metadata
  a distributable package expects — at minimum a `messages.json` (or `messages/`
  install note) and a bundled `README.md`. Verify the exact package-metadata
  conventions against current Sublime / Package Control docs before finalizing;
  include only what a color-scheme-only package actually needs.
- Keep the existing scheme content/mappings. `generate.js` stays zero-runtime-dep +
  deterministic.

### Packaging script
- New `scripts/package-sublime.js`: zips `build/sublime/` into
  `dist/candela-themes.sublime-package` (a plain zip renamed to that extension).
  Prefer the system `zip` over adding a heavy dependency; document the choice. Exits
  non-zero on failure, no interactive prompts.
- Root `package.json`: add `package:sublime` → `node scripts/package-sublime.js`.

### Docs
- Root `README.md`: the "Other editors" line says Sublime is one file per theme, not
  published. Update with the package install path: drop
  `dist/candela-themes.sublime-package` into the Sublime `Installed Packages/` folder
  (or the loose files into `Packages/User/`), and note Package Control publish is a
  follow-up. Update "How themes are generated → Sublime" for the package layout.
- Root `AGENTS.md` step 6: add `package:sublime`.

### Implementation boundary
- **Production surfaces**: `scripts/generate.js` (Sublime emitter: package metadata),
  `scripts/package-sublime.js` (new), root `package.json`.
- **Docs**: `README.md`, `AGENTS.md`.
- **Load-bearing**: `generate.js` zero-runtime-dep + `build/` determinism;
  `themes/candela-themes.json` untouched; the shared TextMate scope table stays the
  syntax mapping.
- **Exclusions**: submitting to Package Control; a `.tmTheme` legacy format; changing
  color mappings; CI release upload.

## Acceptance criteria

- `npm run build` makes `build/sublime/` a valid package: 14 `.sublime-color-scheme`
  files plus the minimal package metadata (e.g. `messages.json` + bundled README).
- `npm run package:sublime` produces `dist/candela-themes.sublime-package`, exits
  non-zero on failure, no interactive prompts.
- Installing the package (`.sublime-package` in `Installed Packages/`, or the files
  in `Packages/User/`) makes the Candela schemes selectable and they apply correctly
  (spot-check a warm, a cool, and one experiment theme).
- Root `package.json` has a `package:sublime` script; `generate.js` stays
  no-runtime-dep and `build/` output byte-identical across runs.
- README (Sublime install + generation sections) reflects the package install;
  `AGENTS.md` step 6 references `package:sublime`.
- Gate green: `python3 -m json.tool themes/candela-themes.json` and
  `node scripts/validate.js` both exit 0.

## Notes

- `.sublime-package` is a zip; the artifact need not be byte-deterministic. `build/`
  is the determinism boundary.
