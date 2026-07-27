# Release runbook

How a maintainer cuts a Candela release and gets it onto every distribution
channel. The root [`AGENTS.md`](../AGENTS.md) owns how themes are built; this file
owns how they ship.

Channels, at a glance:

| Channel | Listed? | How an update ships |
| --- | --- | --- |
| GitHub Releases | live | `Release` creates it from the tag |
| Neovim / Helix / terminals | live | GitHub Releases is canonical — no registry |
| VS Code Marketplace | live | `Publish` → `vscode`, after you approve the gate |
| Open VSX | live | `Publish` → `openvsx`, after you approve the gate |
| JetBrains Marketplace | live | `Publish` → `jetbrains`, then JetBrains moderates the update |
| Zed extension registry | **not yet** | dist repo auto-synced; then a submodule + `version` PR |
| Sublime Package Control | **not yet** | dist repo auto-tagged; tags drive it once the channel PR lands |

**Two dispatches, in order.** `Release` cuts the tag and stops; `Publish` delivers that
tag. The whole loop:

```sh
gh workflow run release.yml -f bump=patch --ref main   # 1. cut the tag
git pull                                               # 2. pick up CI's bump commit
gh workflow run publish.yml -f ref=vX.Y.Z              # 3. deliver it
# 4. approve the `marketplace` gate in the Actions UI
```

Use the `release` skill (`/release`) to drive it — it picks the bump and runs all four
steps. Everything below is the detail behind them. Why two commands and not one:
[Why release and publish are separate](#why-release-and-publish-are-separate).

## Cut a release

Releasing runs entirely in CI. Dispatch the `Release` workflow, main only, and pick
the semver bump:

```sh
gh workflow run release.yml -f bump=<patch|minor|major> --ref main
```

(Or GitHub → Actions → Release → Run workflow.) The workflow then, in the `release`
job:

1. refuses to run off `main`;
2. runs the repository gates (source-JSON validity, `scripts/validate.js`, explorer build);
3. bumps `package.json` (the version source), commits, and tags `vX.Y.Z` — locally in
   the runner, not yet pushed;
4. runs `npm run package` then `npm run package:release`. **This build is the gate:**
   if any package fails, the job stops here and the tag never reaches the remote, so a
   broken build never leaves a dangling tag;
5. pushes the bump commit + tag to `main` and creates the GitHub Release with generated
   notes and every artifact plus `SHA256SUMS.txt`.

That is where `Release` ends. Delivering the tag to the dist repos and the three
marketplaces is the second dispatch, [`Publish`](#delivery-publish).

Everything is rebuilt in the runner — generated `build/` and `dist/` are never
committed, so a release never depends on local state. After a release, `git pull` so
local `main` picks up CI's version-bump commit.

The version decision (bump or skip) is guided by the `release` skill (`/release`),
which reasons about whether the changes since the last tag are worth shipping.

> **`main` is intentionally unprotected.** Step 5 pushes the bump commit straight to
> `main` using the default `GITHUB_TOKEN`, which works only because `main` is
> unprotected. A ruleset requiring PRs would block that push, and on this
> **user-owned** repo GitHub Actions cannot be granted a ruleset bypass (bypass actors
> must belong to an owning organization). Branch protection is therefore deferred (see
> D8 in [`docs/decisions.md`](decisions.md)); enabling it needs one of: moving the repo
> into an org (the Actions bypass then works), a release-PR model where merging a bump
> PR triggers the tag + build, or a fine-grained PAT with an admin bypass. Release tags
> (`v*`) and the `marketplace` environment are protected regardless (below).

### Local dry run (optional)

CI gates the build, but a full local dry run catches a generator/packaging break
before you spend a CI run:

```sh
npm ci
npm run release:dry-run   # validate + npm run package + npm run package:release
ls dist/                  # native artifacts, Zed archive, all-formats ZIP, SHA256SUMS.txt
```

Requires `node`, `python3`, a JDK (17+) and Gradle (9+) for the IntelliJ build, and
system `zip`/`tar`.

### candela.ink download links

There are no version-independent aliases to maintain. GitHub already serves
`…/releases/latest` and `…/releases/latest/download/<asset>` as stable, version-
independent URLs, and those preserve version traceability. The README and the app
point at `releases/latest`; do not mirror artifacts under candela.ink (see decision
D6 in [`docs/decisions.md`](decisions.md)).

## Delivery (`Publish`)

`.github/workflows/publish.yml` is the single place a version is handed to
downstream channels. Always dispatched by hand, after the tag exists. Every channel
input defaults to `true`:

```sh
gh workflow run publish.yml -f ref=vX.Y.Z                       # every channel
gh workflow run publish.yml -f ref=vX.Y.Z -f jetbrains=true \
  -f vscode=false -f openvsx=false -f dist_repos=false          # retry one
```

> **Pass the tag as the `ref` input, never as `--ref`.** `--ref` selects which
> *version of the workflow file* GitHub runs, so `--ref vX.Y.Z` runs whatever
> publish.yml looked like at that tag — stale, or missing entirely if the file was
> added or renamed later (that failure reads `Workflow does not have
> 'workflow_dispatch' trigger`). Dispatching from the default branch with `-f ref=`
> keeps the workflow definition and the published version independent.

Jobs are split by **reversibility**, not by tool:

| Job | Channel | Gate | Why |
| --- | --- | --- | --- |
| `dist-repos` | Zed + Sublime dist repos | none, runs immediately | git pushes to repos we own; reversible |
| `vscode` | VS Code Marketplace | `marketplace` environment, maintainer approval | a published version can never be reused or unpublished |
| `openvsx` | Open VSX | same | same |
| `jetbrains` | JetBrains Marketplace | same | same |

A channel whose credential secret is missing logs a `::warning::` and exits 0 rather
than failing. A store you haven't registered yet never turns a good release red.

### Why release and publish are separate

A GitHub Release is reversible; a published store version is not. The release build is
atomic and gates the tag push, while store uploads fail for reasons this repo cannot
prevent (rate limits, expired PATs, moderation queues) — so a flaky upload must never
invalidate correct artifacts, and a retry must never risk re-tagging. Keeping them
apart also keeps store tokens out of the job that pushes to `main`. Full reasoning,
including why the two were briefly chained: D10 and D11 in
[`docs/decisions.md`](decisions.md).

### Secrets

On the `marketplace` environment:

| Secret | Used by | What it is |
| --- | --- | --- |
| `VSCE_PAT` | VS Code | Azure DevOps PAT, scope **Marketplace → Manage**, all orgs |
| `OVSX_PAT` | Open VSX | Open VSX access token |
| `JETBRAINS_TOKEN` | JetBrains | Marketplace **permanent** token |

The `marketplace` environment requires the sole maintainer's approval, permits
self-review (one maintainer), and forbids administrative bypass. Add the secrets
above under repo **Settings → Environments → `marketplace`**.

> **Deployment policy must allow `main`, not just `v*`.** `Publish` is dispatched
> from the default branch (the tag travels as the `ref` input), so `github.ref` is
> `refs/heads/main` and a tags-only policy would block every delivery. Add `main`
> alongside `v*` in **Settings → Environments → `marketplace` → deployment branches
> and tags**. The tag policy was never the real protection: the required reviewer is,
> and it still applies. The jobs *build* from the `ref` input, so the published
> artifacts always carry the released version, not main's HEAD.

## Store registration

Every store needed one manual setup before automation could take over. All three
automated stores are done; the two PR registries are not.
[`marketplace-playbook.md`](marketplace-playbook.md) is the click-by-click walkthrough —
this is the reference for what is fixed and where to look.

| Store | Permanent id | Secret | Verify |
| --- | --- | --- | --- |
| VS Code | publisher `candela` · name `candela-themes` | `VSCE_PAT` | <https://marketplace.visualstudio.com/items?itemName=candela.candela-themes> |
| Open VSX | namespace `candela` | `OVSX_PAT` | <https://open-vsx.org/extension/candela/candela-themes> |
| JetBrains | plugin id `com.candela.themes` · numeric `33084` | `JETBRAINS_TOKEN` | <https://plugins.jetbrains.com/plugin/33084-candela-themes> |
| Zed | extension id `candela-themes` | — (PR) | <https://github.com/zed-industries/extensions> |
| Sublime | package `candela-themes` | — (PR) | <https://github.com/wbond/package_control_channel> |

Nothing in that column can be renamed later, and a published version number can never
be reused or unpublished on any of the three stores.

Per-store facts that outlive the setup:

- **VS Code** — classic Azure DevOps PATs retire **2026-12-01**; migrate `VSCE_PAT` to
  Entra ID workload identity federation (`vsce publish --azure-credential`) before then.
- **Open VSX** — a new upload shows as "Deactivated" for a few seconds while it
  processes. Same `.vsix` as VS Code.
- **JetBrains** — the plugin went live after a hand review of its first version, and
  **each update is moderated too**: a successful upload returns `201` with
  `"approve": false`, and the version appears on the listing once a moderator clears it.
  Uploads are identified by `xmlId`, read from the generated `plugin.xml`.
- **Zed / Sublime** — both install from committed git contents, so they consume the dist
  repos below rather than this repo.

### Dedicated distribution repos

Zed and Sublime both install from *committed git contents*, but this repo's `build/`
is gitignored. So the generated layouts are republished, one tagged commit per
release, into two dedicated repos:

- **<https://github.com/schovi/candela-themes-zed>** — `extension.toml`,
  `themes/candela.json`, `LICENSE`.
- **<https://github.com/schovi/candela-themes-sublime>** — the 16
  `.sublime-color-scheme` files, `messages`, `README.md`, `LICENSE`.

Both are generated — never hand-edit. The `Publish` workflow's `dist-repos` job syncs
and tags them via `scripts/publish-extension-repos.js` (also runnable locally:
`node scripts/publish-extension-repos.js [zed|sublime]`). It carries no environment
and no approval — these pushes go to repos we own and are reversible, so they land as
soon as the release job finishes. CI needs a cross-repo token because the default
`GITHUB_TOKEN` can't push to other repos:

| Secret | Scope | Used by |
| --- | --- | --- |
| `DIST_PUSH_TOKEN` | `contents:write` on both dist repos (fine-grained PAT) | `Publish` workflow, `dist-repos` job |

This one is a **repository** secret, not a `marketplace` environment secret — the
`dist-repos` job runs outside that environment. Until it's set, the job logs a warning
and skips (the release itself still succeeds).

### Zed and Sublime (the PR registries)

Neither has a publisher API, so each needs a human PR — first to get listed, and for
Zed once per release after that. The walkthroughs are in
[`marketplace-playbook.md`](marketplace-playbook.md); what a release owes them:

- **Zed** — one PR per release to <https://github.com/zed-industries/extensions>:
  bump the `extensions/candela-themes` submodule to the new tag and `version` in
  `extensions.toml`, then `pnpm sort-extensions`. The dist repo is already synced and
  tagged by `dist-repos`, so this is a two-line change.
- **Sublime** — nothing. Package Control polls tags on the dist repo, which
  `dist-repos` creates every release. (Branch-based releases are deprecated; tags are
  required.)

> **Not yet listed, and `candela-theme` in Zed's registry is not ours** — it belongs to
> an unrelated author. Our id is `candela-themes`, still unclaimed. Don't read that
> entry as proof Candela is already there.
