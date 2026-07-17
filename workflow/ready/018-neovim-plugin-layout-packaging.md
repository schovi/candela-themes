# 018 — Neovim plugin layout + packaging

priority: 40

## What & why

Neovim colorschemes are installed via plugin managers (lazy.nvim, packer, vim-plug)
from a git repo with a conventional layout — `colors/<name>.lua` on the runtimepath.
Today Aurora emits flat `build/nvim/aurora-<id>.lua` files, which don't drop into a
plugin manager as-is. Mirror 012 for VS Code: emit a plugin-manager-ready repo layout
and a packaging script that produces a release archive in `dist/`.

## Spec

Follow the 012 pattern (packaging script + `package:<tool>` npm script + metadata +
docs), applied to Neovim.

### Plugin layout (emitted into `build/nvim/`)
- Change the Neovim emitter in `scripts/generate.js` to write the colorschemes under
  `build/nvim/colors/aurora-<id>.lua` (so `:colorscheme aurora-<id>` resolves once the
  dir is on the runtimepath) plus a bundled `README.md` documenting plugin-manager
  install (e.g. a lazy.nvim spec pointing at the repo). Keep the self-contained Lua
  content from task 004 (no plugins, `background=light`, legacy + terminal groups).
- `generate.js` stays zero-runtime-dep + deterministic.

### Packaging script
- New `scripts/package-nvim.js`: produces `dist/aurora-themes-nvim-<version>.tar.gz`
  containing the `build/nvim/` plugin layout (colors/ + README). Prefer system `tar`
  over a heavy dependency; document the choice. Exits non-zero on failure, no
  interactive prompts.
- Root `package.json`: add `package:nvim` → `node scripts/package-nvim.js`.

### Docs
- Root `README.md`: the "Other editors" line says Neovim is one file per theme. Update
  to the plugin-manager path (point a lazy.nvim/packer spec at the repo, or drop
  `colors/` onto the runtimepath) and note the release archive. Update "How themes are
  generated → Neovim" for the `colors/` layout.
- Root `AGENTS.md` step 6: add `package:nvim`.

### Implementation boundary
- **Production surfaces**: `scripts/generate.js` (Neovim emitter: `colors/` layout +
  README), `scripts/package-nvim.js` (new), root `package.json`.
- **Docs**: `README.md`, `AGENTS.md`.
- **Load-bearing**: `generate.js` zero-runtime-dep + `build/` determinism;
  `themes/aurora-themes.json` untouched; the chosen Lua-colorscheme approach from
  task 004 (not base16) stays.
- **Exclusions**: publishing the plugin to any registry / awesome-neovim; a `lua/`
  runtime module with config options (colorschemes need only `colors/`); CI release
  upload; changing highlight-group mappings.

## Acceptance criteria

- `npm run build` writes `build/nvim/colors/aurora-<id>.lua` for all 14 themes plus a
  bundled `README.md` with plugin-manager install instructions.
- Putting `build/nvim/` on the runtimepath (or installing via a plugin manager) makes
  `:colorscheme aurora-<id>` load and apply correctly (spot-check a warm, a cool, and
  one experiment theme).
- `npm run package:nvim` produces `dist/aurora-themes-nvim-<version>.tar.gz`, exits
  non-zero on failure, no interactive prompts.
- Root `package.json` has a `package:nvim` script; `generate.js` stays no-runtime-dep
  and `build/` output byte-identical across runs.
- README (Neovim install + generation sections) reflects the plugin layout;
  `AGENTS.md` step 6 references `package:nvim`.
- Gate green: `python3 -m json.tool themes/aurora-themes.json` and
  `node scripts/validate.js` both exit 0.

## Notes

- The tarball need not be byte-deterministic; `build/` is the determinism boundary.
