# Release runbook

How a maintainer cuts a Candela release and gets it onto every distribution
channel. The root [`AGENTS.md`](../AGENTS.md) owns how themes are built; this file
owns how they ship.

Channels, at a glance:

| Channel | How it ships | Automated updates |
| --- | --- | --- |
| GitHub Releases | `Release` workflow on a `vX.Y.Z` tag | Yes (the tag) |
| VS Code Marketplace | store listing | Yes (`Publish` workflow) |
| Open VSX | store listing | Yes (`Publish` workflow) |
| JetBrains Marketplace | store listing | Yes, after first approval (`Publish` workflow) |
| Zed extension registry | submodule → `candela-themes-zed` dist repo | Dist repo auto-synced; version-bump PR each release |
| Sublime Package Control | tags on `candela-themes-sublime` dist repo | Yes, after one-time channel PR (tags drive it) |
| Neovim / Helix / terminals | GitHub Releases (canonical) | Yes (the tag) |

## Cut a release

Releasing runs entirely in CI. Dispatch the `Release` workflow, main only, and pick
the semver bump:

```sh
gh workflow run release.yml -f bump=<patch|minor|major> --ref main
```

(Or GitHub → Actions → Release → Run workflow.) The workflow then, in one job:

1. refuses to run off `main`;
2. runs the repository gates (source-JSON validity, `scripts/validate.js`, explorer build);
3. bumps `package.json` (the version source), commits, and tags `vX.Y.Z` — locally in
   the runner, not yet pushed;
4. runs `npm run package` then `npm run package:release`. **This build is the gate:**
   if any package fails, the job stops here and the tag never reaches the remote, so a
   broken build never leaves a dangling tag;
5. pushes the bump commit + tag to `main` and creates the GitHub Release with generated
   notes and every artifact plus `SHA256SUMS.txt`.

Everything is rebuilt in the runner — generated `build/` and `dist/` are never
committed, so a release never depends on local state. After a release, `git pull` so
local `main` picks up CI's version-bump commit.

The version decision (bump or skip) is guided by the `release` skill (`/release`),
which reasons about whether the changes since the last tag are worth shipping.

> **If you protect `main`:** step 5 pushes the bump commit straight to `main` using
> the default `GITHUB_TOKEN`, which works only because `main` is currently
> unprotected. Adding branch protection (required PRs/reviews) will make that push
> fail. To keep releasing, either allow the Actions bot to bypass protection for this
> push (a branch-protection carve-out / bypass list), or switch to a release-PR model
> where CI opens a PR with the bump and merging it triggers the tag + build.

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

## Marketplace automation

The `Publish to marketplaces` workflow (`.github/workflows/publish-marketplaces.yml`)
is `workflow_dispatch`-only and every job runs in the protected `marketplace`
GitHub environment. Ordinary PR/branch/tag CI cannot read the credentials, and a
maintainer approves each run. Dispatch it with the release tag and toggle the
targets to publish.

Secrets live on the `marketplace` environment:

| Secret | Used by | What it is |
| --- | --- | --- |
| `VSCE_PAT` | VS Code | Azure DevOps PAT, scope **Marketplace → Manage**, all orgs |
| `OVSX_PAT` | Open VSX | Open VSX access token |
| `JETBRAINS_TOKEN` | JetBrains | Marketplace **permanent** token |
| `JETBRAINS_PLUGIN_ID` | JetBrains | numeric plugin id assigned at first upload |

Configure the environment once: repo **Settings → Environments → New environment →
`marketplace`**, add **Required reviewers**, then add the secrets above.

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
3. First publish: dispatch `Publish to marketplaces` with `vscode` checked (or run
   `vsce publish` locally once). Verify the listing at
   `https://marketplace.visualstudio.com/items?itemName=candela.candela-themes`.
4. Gotcha: extension name/publisher are reserved permanently; versions can't be
   reused. Classic Azure DevOps PATs retire **2026-12-01** — migrate to Entra ID
   workload identity federation before then.

### Open VSX

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

Both are generated — never hand-edit. The release workflow syncs and tags them via
`scripts/publish-extension-repos.js` (also runnable locally:
`node scripts/publish-extension-repos.js [zed|sublime]`). CI needs a cross-repo token
because the default `GITHUB_TOKEN` can't push to other repos:

| Secret | Scope | Used by |
| --- | --- | --- |
| `DIST_PUSH_TOKEN` | `contents:write` on both dist repos (fine-grained PAT) | `Release` workflow, dist-repo sync step |

Until that secret is set, the sync step logs a warning and skips (the release itself
still succeeds).

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
