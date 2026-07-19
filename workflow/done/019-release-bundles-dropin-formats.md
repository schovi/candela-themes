# 019 — Release bundles for drop-in formats (terminals + Helix)

done: 2026-07-19

## What & why

The remaining formats — the six terminals (iTerm2, Alacritty, Kitty, WezTerm,
Windows Terminal, Ghostty) and Helix — have no extension/plugin system; you just
import or drop a config file. There's nothing to "package" into an installer, but
they still deserve the 012-style `dist/` output: one clean release archive per tool
so a user can download all 14 configs for their tool in one file instead of fishing
individual files out of `build/`.

## Spec

Follow the 012 pattern where it applies (a `package:*` npm script producing `dist/`
artifacts + docs); there is no per-tool metadata/manifest to harden here since these
formats have none.

### Packaging script
- New `scripts/package-bundles.js`: for each drop-in tool
  (`iterm2`, `alacritty`, `kitty`, `wezterm`, `windows-terminal`, `ghostty`, `helix`),
  produce `dist/candela-themes-<tool>-<version>.tar.gz` (or `.zip` where friendlier for
  the platform, e.g. Windows Terminal) containing that tool's 14 config files from
  `build/<tool>/` plus a short bundled `README.txt`/`README.md` with the one-paragraph
  install steps for that tool (reuse the README's existing per-tool instructions).
  Prefer system `tar`/`zip` over a heavy dependency; document the choice. Exits
  non-zero on failure, no interactive prompts.
- Root `package.json`: add `package:bundles` → `node scripts/package-bundles.js`.
- Whether this also emits a single combined "everything" archive is optional — decide
  during implementation and note it; per-tool archives are the requirement.

### Docs
- Root `README.md`: in "Other terminals" and "Other editors (… Helix)", add that a
  packaged per-tool archive is available via `npm run package:bundles` alongside the
  loose-file install. No generation-section change is needed (the emitters are
  unchanged) beyond a one-line pointer if useful.
- Root `AGENTS.md` step 6: add `package:bundles`.

### Implementation boundary
- **Production surfaces**: `scripts/package-bundles.js` (new), root `package.json`.
  `scripts/generate.js` is **not** changed — these emitters already produce the right
  files; this task only bundles them.
- **Docs**: `README.md`, `AGENTS.md`.
- **Load-bearing**: reads only from `build/<tool>/`; assumes a fresh build (run it
  first or document the assumption, matching the other packaging scripts);
  `themes/candela-themes.json` untouched.
- **Exclusions**: any registry (these have none); CI/GitHub-release upload of the
  archives (separate release-automation follow-up); changing any emitter output.

## Acceptance criteria

- `npm run package:bundles` produces one archive per drop-in tool under `dist/`
  (`candela-themes-<tool>-<version>.{tar.gz|zip}` for iterm2, alacritty, kitty, wezterm,
  windows-terminal, ghostty, helix), each containing that tool's 14 config files plus a
  short install README. Exits non-zero on failure, no interactive prompts.
- Extracting an archive and importing/dropping a file installs the theme for that tool
  (spot-check at least one terminal archive and the Helix archive; for tools not
  runnable locally, verify the archive contents against the expected file list and say
  so).
- Root `package.json` has a `package:bundles` script; `scripts/generate.js` is
  unchanged.
- README (terminals + Helix sections) mentions the packaged archives; `AGENTS.md`
  step 6 references `package:bundles`.
- Gate green: `python3 -m json.tool themes/candela-themes.json` and
  `node scripts/validate.js` both exit 0.

## Notes

- Archives need not be byte-deterministic; `build/` is the determinism boundary.
- Windows Terminal ships a JSON *fragment* (not a standalone file) — the bundle README
  must say to merge it into `settings.json`, not replace it.
