---
name: release
description: >
  Cut a versioned GitHub Release for Candela Themes with a deliberate, gated loop:
  decide whether a release is warranted, choose the semver bump, dispatch the
  CI release workflow, watch it, and verify the published assets. Use when the
  user says "/release", "cut a release", "publish a new version", "ship a
  version", or "release the themes". Delivery to every channel (dist repos +
  editor marketplaces) is a second dispatch this skill also makes; the
  irreversible store publishes wait on a maintainer approving the `marketplace`
  environment gate (see docs/release-runbook.md). Project-specific; only
  meaningful in the candela-themes repo.
---

# Release (Candela Themes)

One deliberate loop to cut a versioned GitHub Release. It decides **whether** to
release and **what** the version should be, then hands the build+tag+publish to CI.
The version decision stays with you (inline); the mechanics are delegated.

**How releasing works here:** the entire release runs in
`.github/workflows/release.yml`, triggered by `workflow_dispatch`, **main only**.
CI validates, creates an unpushed version commit and tag, builds every package at
that version, then pushes and publishes the GitHub Release. A failed build leaves
no remote commit or tag. Nothing is built or tagged on your machine.

**Delivery is a second dispatch.** `Release` stops at the GitHub Release.
`.github/workflows/publish.yml` then delivers that tag: it syncs the Zed + Sublime
dist repos immediately, and queues VS Code / Open VSX / JetBrains behind the
protected `marketplace` environment — those three are irreversible (a published
version number can never be reused), so a maintainer must approve them in the GitHub
UI. A store with no credential secret configured warns and skips instead of failing.

**Your job here** is the version decision, a green GitHub Release, and then firing
the publish dispatch (step 7) so the stores never lag the tag. Zed's registry still
needs its manual submodule-bump PR (`docs/release-runbook.md`).

## Model (read first)

- `themes/candela-themes.json` is the source of truth. `build/` and `dist/` are
  generated and **gitignored — never committed**. The release artifacts live only
  as GitHub Release assets, rebuilt in CI from `main`.
- CI bumps the root `package.json` version and creates the `vX.Y.Z` commit and tag
  in the runner before packaging. The version flows into every generated manifest
  (VS Code, IntelliJ, Zed) via `scripts/generate.js`, and into artifact filenames.
  CI pushes the commit and tag only after packaging succeeds.

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

This dispatch only cuts the tag and the GitHub Release. Delivery is step 7.

## 6. Watch CI and verify

```sh
sleep 4
RUN=$(gh run list --workflow=release.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run watch "$RUN" --exit-status      # capture ITS exit code directly
```

Do **not** chain a trailing command after `gh run watch` that masks its exit status.

- **On failure:** `gh run view "$RUN" --log-failed`, diagnose the root cause, fix,
  commit, push to `main`, then re-dispatch (step 5). No release commit or tag was
  pushed, so there is nothing to unwind.
- **On success:** confirm the Release is real and complete:
  ```sh
  V=$(node -p "require('./package.json').version")   # after: git pull, to see CI's bump
  gh release view "v$V" --json isDraft,url,assets -q '.url, "draft:\(.isDraft)", (.assets[].name)'
  ```
  Confirm `isDraft=false` and the full asset set: every per-tool archive, the
  `.vsix`, the `.sublime-package`, the Zed archive, the all-formats zip, and
  `SHA256SUMS.txt`. Then `git pull` so local `main` picks up CI's version-bump commit.

## 7. Deliver the tag (second dispatch)

Only after the Release is verified green. The tag goes in as the **`ref` input**;
never as `--ref`, which would run the copy of publish.yml that existed at that tag:

```sh
gh workflow run publish.yml -f ref="v$V"
PUB=$(gh run list --workflow=publish.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$PUB" --json jobs -q '.jobs[] | "\(.name) \(.status) \(.conclusion // "")"'
```

`dist-repos` runs immediately. `vscode`, `openvsx` and `jetbrains` sit `waiting` on
the `marketplace` environment gate until the maintainer approves in the UI — expected,
not a hang. Don't `gh run watch` this one to completion; report the gate instead.

Re-dispatch a single channel the same way, others `=false`:
`gh workflow run publish.yml -f ref="v$V" -f jetbrains=true -f vscode=false -f openvsx=false -f dist_repos=false`

## 8. Report

- Release URL, the asset list, the version chosen and why, and what changed since the
  last tag.
- State the delivery status: dist repos synced; VS Code / Open VSX / JetBrains are
  **waiting on the maintainer's approval** of the `marketplace` environment gate
  (link the publish run). Name any channel that warn-skipped for a missing secret.
- Remaining manual step: the Zed submodule + `version` bump PR to
  `zed-industries/extensions` (`docs/release-runbook.md`). Sublime needs nothing.

## Delegation

Bounded "what changed / is it shipping" diff summaries may go to a subagent. Keep the
release decision, the version choice, and the dispatch/watch/verify actions inline.
