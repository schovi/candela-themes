# 012 — Build/dist split + proper VS Code extension packaging

priority: 50

## What & why

Today `scripts/generate.js` writes generated tool themes into `dist/`, and all 171
of those files are committed to the repo. `dist/vscode/` is a bare extension
(minimal `package.json`, no LICENSE, no `.vscodeignore`), so `vsce package` only
runs after clicking through three warnings.

Split the two concerns and make VS Code the first properly-packaged output:

- **build step** — `scripts/generate.js` emits generator output (all formats) into
  `build/`, the source fragments.
- **dist step** — a packaging script turns `build/vscode/` into a real
  `.vsix` under `dist/`.
- **Neither `build/` nor `dist/` is committed** — both gitignored, generated output
  removed from the index. (Uploading artifacts to a GitHub release is a later task;
  this one only stops committing them.)

Scope now: the build/dist model repo-wide (all formats move to `build/`), a proper
VS Code extension + `.vsix` packaging script, and the docs updated to match. Other
editors' packaging into `dist/` and any release automation are out of scope.

## Spec

### Build/dist directories
- `scripts/generate.js`: change its output root from `dist/` to `build/`. Every
  emitter (terminal formats, vscode, intellij, zed, sublime, nvim, helix) writes
  under `build/<tool>/`. Keep the wipe-and-rewrite + determinism behavior. Update
  its console messages. `generate.js` stays **zero runtime dependencies**.
- `dist/` becomes the home for packaged distributables. For now the only producer
  is the VS Code packaging script (`dist/aurora-themes-<version>.vsix`).
- New root `.gitignore`: ignore `build/`, `dist/`, `node_modules/`.
- Remove the currently-committed generated output from git tracking
  (`git rm -r --cached dist`), so the working tree keeps files but git no longer
  tracks them. Verify `git ls-files` shows nothing under `build/` or `dist/`.

### Tooling
- New root `package.json` (this is the repo tooling manifest, distinct from the
  generated extension manifest under `build/vscode/`). Scripts at minimum:
  - `build` → `node scripts/generate.js`
  - `validate` → `node scripts/validate.js`
  - `package:vscode` → the new packaging script
- `@vscode/vsce` as a `devDependency` (pin a current major). `node_modules/`
  gitignored.
- New `scripts/package-vscode.js`: runs `build/vscode/` through vsce
  (`vsce package`), writing the `.vsix` into `dist/`. It may assume `build/` is
  fresh or run the build first — pick one and document it. Must exit non-zero if
  vsce fails.

### VS Code extension metadata (generated into `build/vscode/`)
- Extend `emitVSCode` in `generate.js` so the generated `build/vscode/package.json`
  carries full, warning-free metadata: `displayName`, `description`, `version`,
  `publisher` (`aurora`), `engines`, `categories`, `keywords`, `galleryBanner`,
  `repository`, `bugs`, `homepage`, `license`, and the existing
  `contributes.themes` (14). Use a clearly-marked placeholder repository URL
  (e.g. `https://github.com/CHANGEME/aurora-themes`).
- `icon`: leave a TODO — no icon asset exists (needs a 128px PNG). Do **not**
  invent a binary. Note it in the extension README and/or a code comment.
- Emit a bundled `README.md` into `build/vscode/` (vsce includes it as the
  Marketplace description) and a `.vscodeignore` so packaging is warning-free and
  ships only the necessary files.
- New root `LICENSE` file (MIT). The extension `package.json` `license: "MIT"`
  points at it; ensure the LICENSE (or a copy/reference) is available to the
  packaged extension so vsce's LICENSE warning is gone.

### Docs
- `README.md` (root): rewrite the install/build sections. It currently says output
  is "pre-generated and committed under `dist/` — no build step" and points users
  at `dist/<tool>/...` files. Replace with the build-then-use model: run
  `npm run build` to produce `build/`, then install from `build/<tool>/` or grab
  the packaged `.vsix`. Point path references at `build/` (or the future release
  download), not the committed-`dist/` model.
- `docs/design-handover/README.md`: update its `dist/...` path references and the
  "generator writes dist/" prose to `build/`.
- `AGENTS.md` (root, the "Working on themes" loop from task 007): the loop step
  "`node scripts/generate.js` — wipes and rewrites `dist/`" and "never hand-edit
  `dist/`" must point at `build/`. Add the packaging step where it fits.
- Do a bounded grep for other stale `dist/` references introduced by tasks
  001–006 and fix the ones that are now wrong; skip any that legitimately mean
  packaged artifacts.

### Implementation boundary
- **Production surfaces**: `scripts/generate.js` (output root + vscode metadata),
  `scripts/package-vscode.js` (new), `package.json` (new root), `.gitignore` (new),
  `.vscodeignore` (generated into build/vscode/), `LICENSE` (new),
  extension `README.md` (generated into build/vscode/).
- **Docs**: `README.md`, `docs/design-handover/README.md`, `AGENTS.md`.
- **Load-bearing**: `generate.js` must stay zero-runtime-dep and deterministic;
  `docs/design-handover/aurora-themes.json` stays the single source of truth
  (untouched); the contract's only automated gate is JSON validity + `validate.js`.
- **Exclusions**: GitHub release automation / CI upload; packaging non-VS-Code
  formats into `dist/` (they stay as `build/` fragments); a real icon PNG; a real
  publisher/repo/Marketplace publish.

## Acceptance criteria

- `npm run build` (and `node scripts/generate.js` directly) writes all formats
  under `build/`; nothing is written to a git-tracked path.
- `build/`, `dist/`, and `node_modules/` are gitignored; `git ls-files` shows no
  files under `build/` or `dist/` (previously-committed output is untracked).
- `npm run package:vscode` produces `dist/aurora-themes-<version>.vsix`, and the
  underlying `vsce package` completes with **no warnings** (repository, LICENSE,
  and `.vscodeignore` all satisfied — no interactive prompts).
- The generated `build/vscode/package.json` includes displayName, description,
  version, publisher, engines, categories, keywords, galleryBanner, repository
  (placeholder URL), bugs, homepage, license, and 14 `contributes.themes`. `icon`
  is a documented TODO, not a fabricated file.
- A root MIT `LICENSE` exists; `build/vscode/` contains a bundled `README.md` and a
  `.vscodeignore`.
- Root `package.json` exists with `build`, `validate`, and `package:vscode` scripts
  and `@vscode/vsce` as a devDependency; `scripts/generate.js` has no runtime
  `require` of any installed dependency.
- Root `README.md`, `docs/design-handover/README.md`, and `AGENTS.md` no longer
  claim generated output is committed or that there is "no build step", and their
  path references reflect the `build/` (source) + `dist/` (packaged) model.
- Contract gate green: `python3 -m json.tool docs/design-handover/aurora-themes.json`
  and `node scripts/validate.js` both exit 0.

## Notes

- `.vsix` packaging is not byte-deterministic (vsce embeds metadata); that's fine
  since `dist/` is never committed. The determinism guarantee applies to `build/`.
- The GitHub-release download flow the user wants pairs with release automation —
  groom that as a follow-up once this structure lands.
