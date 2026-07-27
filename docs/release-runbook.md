# Release runbook

How a maintainer cuts a Candela release and gets it onto every distribution
channel. The root [`AGENTS.md`](../AGENTS.md) owns how themes are built; this file
owns how they ship.

Channels, at a glance:

| Channel | How it ships | Automated updates |
| --- | --- | --- |
| GitHub Releases | `Release` workflow on a `vX.Y.Z` tag | Yes (the tag) |
| VS Code Marketplace | store listing | Yes (`Publish`, after maintainer approval) |
| Open VSX | store listing | Yes (`Publish`, after maintainer approval) |
| JetBrains Marketplace | store listing | Yes after first approval (`Publish`, after maintainer approval) |
| Zed extension registry | submodule → `candela-themes-zed` dist repo | Dist repo auto-synced; version-bump PR each release |
| Sublime Package Control | tags on `candela-themes-sublime` dist repo | Yes, after one-time channel PR (tags drive it) |
| Neovim / Helix / terminals | GitHub Releases (canonical) | Yes (the tag) |

**Two dispatches, in order.** `Release` cuts the tag and the GitHub Release, and
stops. `Publish` then delivers that tag to the channels above. They are separate
commands on purpose — they differ in reversibility, failure modes and retry
granularity (see [Why release and publish are separate](#why-release-and-publish-are-separate)) —
so cutting a release is never blocked by a store outage, and re-publishing never
risks re-tagging. The cost is remembering step two; the `release` skill reminds you,
and so does a notice at the end of every `Release` run.

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

Two dispatches rather than one chained pipeline, because the halves differ in four
ways that matter:

1. **Reversibility.** A GitHub Release can be deleted and re-tagged. A version
   published to VS Code Marketplace, Open VSX or JetBrains is burned permanently.
2. **Credential blast radius.** The `release` job never sees a store token. The
   marketplace jobs hold them inside a protected environment behind a required
   reviewer.
3. **Failure semantics.** The release build is atomic — it gates the tag push. Store
   publishes hit three third-party APIs that fail for reasons outside this repo
   (rate limits, expired PATs, moderation queues). A flaky upload must not invalidate
   artifacts that are already correct.
4. **Retry granularity.** A failed store publish is one re-dispatch of that channel,
   with no risk of re-tagging.

Chaining them (a `workflow_call` job on the end of `Release`) was tried and reverted:
it made one command carry two failure domains, and the version of publish.yml that
ran became coupled to which ref you dispatched. Two predictable commands beat one
clever one (D10).

Secrets live on the `marketplace` environment:

| Secret | Used by | What it is |
| --- | --- | --- |
| `VSCE_PAT` | VS Code | Azure DevOps PAT, scope **Marketplace → Manage**, all orgs |
| `OVSX_PAT` | Open VSX | Open VSX access token |
| `JETBRAINS_TOKEN` | JetBrains | Marketplace **permanent** token |
| `JETBRAINS_PLUGIN_ID` | JetBrains | numeric plugin id assigned at first upload |

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

## First submissions

Each store needs a one-time manual setup before the automation (or, for Zed/Sublime,
each update) can run. Do these once, then hand control to the workflow above. For the
step-by-step first-time walkthrough (with prerequisites and verify links), see
[`marketplace-playbook.md`](marketplace-playbook.md); the terse per-store reference and
exact secret names follow here.

### VS Code Marketplace

1. Create an Azure DevOps organization, then a **publisher** at
   <https://marketplace.visualstudio.com/manage>. The publisher id is permanent and
   must equal `publisher` in the generated `build/vscode/package.json` (`candela`).
2. Create an Azure DevOps PAT (scope **Marketplace → Manage**, "all accessible
   organizations"); store it as the `VSCE_PAT` environment secret.
3. First publish: dispatch `Publish` with `vscode` checked (or run
   `vsce publish` locally once). Verify the listing at
   `https://marketplace.visualstudio.com/items?itemName=candela.candela-themes`.
4. Gotcha: extension name/publisher are reserved permanently; versions can't be
   reused. Classic Azure DevOps PATs retire **2026-12-01** — migrate to Entra ID
   workload identity federation before then.

### Open VSX

> Namespace `candela` claimed via
> <https://github.com/EclipseFdn/open-vsx.org/issues/12041> — step 3 is done.

1. Sign in at <https://open-vsx.org> with an Eclipse account and sign the publisher
   agreement.
2. Generate an access token (shown once) → `OVSX_PAT`.
3. Reserve the namespace once: `npx ovsx create-namespace candela -p <token>`. The
   namespace is the immutable id and must match the VS Code publisher.
4. First publish: dispatch with `openvsx` checked (same `.vsix` as VS Code). New
   uploads sit "Deactivated" for a few seconds while processing. Verify at
   `https://open-vsx.org/extension/candela/candela-themes`.

### JetBrains Marketplace

> Registered. Plugin page: <https://plugins.jetbrains.com/plugin/33069-candela-themes>
> — edit/manage at <https://plugins.jetbrains.com/plugin/33069-candela-themes/edit>.
> Numeric plugin id **33069** → `JETBRAINS_PLUGIN_ID`.

1. The **first version must be uploaded through the web UI** at
   <https://plugins.jetbrains.com/plugin/add> and is **manually moderated/reviewed**
   before it goes live. Upload `dist/candela-themes-intellij-<version>.zip` from a
   dry run.
2. After approval, note the numeric plugin id → `JETBRAINS_PLUGIN_ID`. Create a
   **permanent** token under your Marketplace profile → **My Tokens** →
   `JETBRAINS_TOKEN`.
3. Later versions: dispatch with `jetbrains` checked. Updates to an approved plugin
   publish via the API without re-review. The plugin `id` (`com.candela.themes`) and
   numeric id are permanent.

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

### Zed (submodule PR, version bump each release)

No non-interactive publisher. The one-time listing is a PR to
<https://github.com/zed-industries/extensions>:

1. Add **`candela-themes-zed`** as an **HTTPS** git submodule under
   `extensions/candela-themes`, pinned at the release tag.
2. Add a top-level `extensions.toml` entry with the `id` (`candela-themes`) and
   `version`, run `pnpm sort-extensions`, open the PR. On merge, Zed's CI packages
   and publishes.
3. The `id` is permanent; the dist repo carries the required license. Each later
   release: bump the submodule to the new tag + bump `version` in `extensions.toml`
   in a new PR (the dist repo is already synced by CI).

### Sublime Package Control (one-time channel PR, then tags)

No publisher; Package Control polls git tags on the dist repo, which CI tags every
release, so the listing needs setting up only once:

1. Fork <https://github.com/wbond/package_control_channel>, add a repository entry
   under `repository/` pointing at `candela-themes-sublime` with `"tags": true`.
2. Run the ChannelRepositoryTools tests locally, open the PR, await human review.
3. After the listing is merged, every new `vX.Y.Z` tag on the dist repo is picked up
   automatically — no further PRs. (Branch-based releases are deprecated; tags are
   required.)
