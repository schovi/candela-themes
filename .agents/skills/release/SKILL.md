---
name: release
description: >
  Cut a versioned GitHub Release for Candela Themes with a deliberate, gated loop:
  decide whether a release is warranted, choose the semver bump, dispatch the
  CI release workflow, watch it, and verify the published assets. Use when the
  user says "/release", "cut a release", "publish a new version", "ship a
  version", or "release the themes". Does NOT publish to editor marketplaces —
  that is a separate, credentialed, manually-gated step (see
  docs/release-runbook.md). Project-specific; only meaningful in the
  candela-themes repo.
---

# Release (Candela Themes)

One deliberate loop to cut a versioned GitHub Release. It decides **whether** to
release and **what** the version should be, then hands the build+tag+publish to CI.
The version decision stays with you (inline); the mechanics are delegated.

**How releasing works here (Option C — CI-driven):** the entire release runs in
`.github/workflows/release.yml`, triggered by `workflow_dispatch`, **main only**.
CI validates, builds every package, and **only then** bumps the version, tags, and
publishes the GitHub Release. Because the bump/tag happen *after* a green build, a
broken build never creates a tag — there is no dangling-tag cleanup. Nothing is
built or tagged on your machine.

**Out of scope:** publishing to VS Code / Open VSX / JetBrains / Zed / Sublime.
Those need credentials and one-time store registration, run through the separate
`Publish to marketplaces` workflow, and are documented in `docs/release-runbook.md`.
This skill stops at the GitHub Release and points the user there.

## Model (read first)

- `themes/candela-themes.json` is the source of truth. `build/` and `dist/` are
  generated and **gitignored — never committed**. The release artifacts live only
  as GitHub Release assets, rebuilt in CI from `main`.
- CI bumps the root `package.json` version and creates the `vX.Y.Z` tag itself. The
  version flows into every generated manifest (VS Code, IntelliJ, Zed) via
  `scripts/generate.js`, and into artifact filenames.

## 1. Preconditions — hard gate, stop if any fail

- Everything you want in the release is **committed and pushed to `main`**. CI
  releases from `main`'s HEAD; unpushed local commits won't be in it. Confirm
  `git fetch` then local `main` == `origin/main`.
- `gh auth status` succeeds (needed to dispatch, watch, and verify).

## 2. Decide whether to release at all

- Last release: `git describe --tags --abbrev=0 --match 'v*.*.*'` (or "none yet").
- What changed since: `git log --stat <lastTag>..origin/main`.
- Does anything affect **shipped output**? Shipped = `themes/candela-themes.json`,
  `lib/emitters.js`, `lib/colors.js`, `lib/rules.js`, `scripts/` (generator +
  packaging), `package.json` metadata, `assets/icon/`, `LICENSE`.
- **Not** shipped on their own = `workflow/` task tracking, `docs/` (unless bundled
  into a package), `app/` explorer internals (the site deploys separately via Pages).
- If there are **no commits** since the last tag → stop, nothing to release.
- If the only changes are **non-shipping** → say so and recommend **not** releasing.
  Proceed only if the user still wants it.

## 3. Choose the version bump — semver, reasoned from the diff

Pick one `bump` input, state the reasoning, and get confirmation (or use a bump the
user named). Never pick silently when it's ambiguous.

- **patch**: packaging/metadata fixes, corrections with no change to theme
  identities or token roles.
- **minor**: additive, backward-compatible — a new theme, a new tool/format, new
  tokens, a new emitter.
- **major**: breaking — removing/renaming a theme `id`, changing a token's meaning,
  changing a marketplace/package id, dropping a format. (Pre-1.0, a breaking change
  may still go in a minor — flag the judgment rather than assume.)

## 4. Optional local pre-check

CI gates the build, so this is optional — but a full local dry run catches a
generator/packaging break before you spend a CI run:

```sh
node scripts/validate.js && npm ci && npm run release:dry-run
```

Needs local `node`, `python3`, JDK 17+, Gradle 9+, `zip`/`tar`. Skip it if the
toolchain isn't set up locally; CI runs the same gate.

## 5. Trigger the release (main only)

```sh
gh workflow run release.yml -f bump=<patch|minor|major> --ref main
```

(Or the GitHub UI → Actions → Release → Run workflow → pick the bump, branch `main`.)

## 6. Watch CI and verify

```sh
sleep 4
RUN=$(gh run list --workflow=release.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN" --exit-status      # capture ITS exit code directly
```

Do **not** chain a trailing command after `gh run watch` that masks its exit status.

- **On failure:** `gh run view "$RUN" --log-failed`, diagnose the root cause, fix,
  commit, push to `main`, then re-dispatch (step 5). No tag was created, so there is
  nothing to unwind — just run it again.
- **On success:** confirm the Release is real and complete:
  ```sh
  V=$(node -p "require('./package.json').version")   # after: git pull, to see CI's bump
  gh release view "v$V" --json isDraft,url,assets -q '.url, "draft:\(.isDraft)", (.assets[].name)'
  ```
  Confirm `isDraft=false` and the full asset set: every per-tool archive, the
  `.vsix`, the `.sublime-package`, the Zed archive, the all-formats zip, and
  `SHA256SUMS.txt`. Then `git pull` so local `main` picks up CI's version-bump commit.

## 7. Report

- Release URL, the asset list, the version chosen and why, and what changed since the
  last tag.
- Remind the user that marketplace publishing is separate and manual: dispatch the
  `Publish to marketplaces` workflow after the one-time store registration
  (`docs/release-runbook.md`).

## Delegation

Bounded "what changed / is it shipping" diff summaries may go to a subagent. Keep the
release decision, the version choice, and the dispatch/watch/verify actions inline.
