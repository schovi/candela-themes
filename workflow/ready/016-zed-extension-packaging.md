# 016 — Zed extension packaging

priority: 20

## What & why

Zed distributes themes as **extensions** (registry: `zed-industries/extensions`),
but today Aurora only emits a bare `build/zed/aurora.json` theme-family file — not a
valid Zed extension, so it can't be installed as a dev extension or published.
Mirror what 012 did for VS Code: emit a valid Zed theme extension and a packaging
script that assembles it into `dist/`, ready to publish later.

## Spec

Follow the 012 pattern (packaging script + `package:<tool>` npm script + metadata +
docs), applied to Zed.

### Extension layout (emitted into `build/zed/`)
- Extend the Zed emitter in `scripts/generate.js` so `build/zed/` is a valid theme
  extension: an `extension.toml` (id, name, version, `schema_version`, authors with
  a placeholder, description, repository placeholder URL like 012's `CHANGEME`) plus
  the theme family file at the path Zed expects (`themes/aurora.json`). Verify the
  current `extension.toml` fields + `schema_version` and the themes-dir convention
  against Zed's extension docs before finalizing.
- Keep the existing theme content/mappings; this task changes packaging/layout and
  adds metadata, not colors. `generate.js` stays zero-runtime-dep + deterministic.

### Packaging script
- New `scripts/package-zed.js`: assembles the validated extension from `build/zed/`
  into `dist/` — either a clean extension directory (`dist/zed/`) or a
  `dist/aurora-themes-zed-<version>.tar.gz`; pick one and document it. Must exit
  non-zero on failure and run with no interactive prompts.
- Root `package.json`: add `package:zed` → `node scripts/package-zed.js`. If a zip
  is used, prefer the system `zip`/`tar` over a heavy new dependency.

### Docs
- Root `README.md`: the "Other editors" install line currently says Zed is "not
  published to any registry" and is a single family file. Update to: install as a
  Zed **dev extension** from `build/zed/` (Extensions → Install Dev Extension) or
  grab the packaged artifact, and note that registry publish is a follow-up. Update
  "How themes are generated → Zed" for the extension layout.
- Root `AGENTS.md` step 6: add `package:zed` where packaging is described.

### Implementation boundary
- **Production surfaces**: `scripts/generate.js` (Zed emitter: `extension.toml` +
  themes-dir layout), `scripts/package-zed.js` (new), root `package.json`.
- **Docs**: `README.md`, `AGENTS.md`.
- **Load-bearing**: `generate.js` zero-runtime-dep + `build/` determinism;
  `themes/aurora-themes.json` untouched source of truth; `ansiMapping` reuse for
  `terminal.ansi.*` preserved.
- **Exclusions**: submitting a PR to the Zed extensions registry; accounts/tokens;
  CI release upload; changing the theme color mappings.

## Acceptance criteria

- `npm run build` makes `build/zed/` a valid Zed theme extension: an `extension.toml`
  with id/name/version/schema_version/authors/description/repository (placeholder URL)
  and the theme family under the expected `themes/` path.
- `build/zed/` loads via **Extensions → Install Dev Extension** and the Aurora themes
  appear and apply (spot-check a warm, a cool, and one experiment theme).
- `npm run package:zed` produces the documented artifact in `dist/`
  (clean `dist/zed/` dir or `dist/aurora-themes-zed-<version>.tar.gz`), exits non-zero
  on failure, no interactive prompts.
- Root `package.json` has a `package:zed` script; `generate.js` stays no-runtime-dep
  and `build/` output byte-identical across runs.
- README (Zed install + generation sections) reflects the extension layout and dev-
  extension install; `AGENTS.md` step 6 references `package:zed`.
- Gate green: `python3 -m json.tool themes/aurora-themes.json` and
  `node scripts/validate.js` both exit 0.

## Notes

- The packaged artifact need not be byte-deterministic; `build/` is the determinism
  boundary.
