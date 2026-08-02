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

**Two dispatches, both from here.** `Release` (steps 5-6) cuts the tag and the GitHub
Release. `Publish` (step 7) delivers that tag to the dist repos and the three stores.
Everything runs in CI, **main only** — nothing is built or tagged on your machine.

**Your job** is the version decision plus getting both dispatches green. The decision
stays inline; the mechanics are CI's.

- `themes/candela-themes.json` is the source of truth. `build/` and `dist/` are
  generated and **gitignored — never committed**; artifacts exist only as Release
  assets, rebuilt in CI from `main`.
- CI bumps `package.json`, commits and tags in the runner, then packages. The version
  flows into every generated manifest via `scripts/generate.js` and into artifact
  filenames. The commit and tag are pushed only after packaging succeeds, so a failed
  build leaves no remote commit or tag.
- `Publish` gates the three stores behind the protected `marketplace` environment: a
  published version number can never be reused, so a maintainer approves each run in
  the GitHub UI. `dist-repos` needs no approval. A channel with no credential secret
  warns and skips.

Mechanics you don't need to re-derive live in `docs/release-runbook.md`.

## 1. Preconditions — hard gate, stop if any fail

- Everything you want in the release is **committed and pushed to `main`**. CI
  releases from `main`'s HEAD; unpushed local commits won't be in it. Confirm
  `git fetch` then local `main` == `origin/main`.
- `gh auth status` succeeds (needed to dispatch, watch, and verify).

## 2. Decide whether to release at all

- Last release: `git describe --tags --abbrev=0 --match 'v*.*.*'` (or "none yet").
- What changed since: `git log --stat <lastTag>..origin/main`.
- Does anything affect **shipped output**? Shipped = `themes/candela-themes.json`,
  `lib/emitters/`, `lib/colors.js`, `lib/rules.js`, `scripts/` (generator +
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
- **On success:** pull CI's bump commit, then confirm the Release:
  ```sh
  git pull
  V=$(node -p "require('./package.json').version")
  gh release view "v$V" --json isDraft,url,assets -q '.url, "draft:\(.isDraft)", (.assets[].name)'
  ```
  Require `isDraft=false` and the full asset set: every per-tool archive, the `.vsix`,
  the `.sublime-package`, the Zed archive, the all-formats zip, `SHA256SUMS.txt`.

## 7. Deliver the tag (second dispatch)

Only after the Release is green. Pass the tag as the **`ref` input** — `--ref` selects
which *version of publish.yml* runs, which is not what you want:

```sh
gh workflow run publish.yml -f ref="v$V"
PUB=$(gh run list --workflow=publish.yml --limit 1 --json databaseId -q '.[0].databaseId')
gh run view "$PUB" --json jobs -q '.jobs[] | "\(.name) \(.status) \(.conclusion // "")"'
```

`dist-repos` runs immediately; the three store jobs sit `waiting` on the gate until the
maintainer approves — expected, not a hang. Report the gate rather than watching to
completion. Once approved, `gh run watch "$PUB" --exit-status` and confirm each channel:

```sh
curl -s "https://plugins.jetbrains.com/api/plugins/33084/updates" | head -c 200
curl -s "https://open-vsx.org/api/candela/candela-themes" | head -c 200
```

VS Code's gallery API lags the publish by minutes; `Published … v$V` in the job log is
the real confirmation. JetBrains moderates every update, so a `201` means uploaded, not
live.

Retry one channel with the others `=false`:
`gh workflow run publish.yml -f ref="v$V" -f jetbrains=true -f vscode=false -f openvsx=false -f dist_repos=false`

## 8. Report

- Release URL, asset list, the version chosen and why, what changed since the last tag.
- Per-channel delivery status. Name any channel that warn-skipped for a missing secret,
  and say plainly that JetBrains is queued for moderation rather than live.
- Remaining manual step: the Zed submodule + `version` bump PR to
  `zed-industries/extensions` (`docs/release-runbook.md`). Sublime needs nothing.

## Delegation

Bounded "what changed / is it shipping" diff summaries may go to a subagent. Keep the
release decision, the version choice, and the dispatch/watch/verify actions inline.
