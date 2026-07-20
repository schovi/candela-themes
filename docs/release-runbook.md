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
| Zed extension registry | PR to `zed-industries/extensions` | No — manual PR each version |
| Sublime Package Control | semver git tag, one-time channel PR | No publisher; tags drive it |
| Neovim / Helix / terminals | GitHub Releases (canonical) | Yes (the tag) |

## Cut a release

The root `package.json` version **is** the release version. Bump it and tag in one
step:

```sh
npm version X.Y.Z        # updates package.json + package-lock.json, commits, tags vX.Y.Z
git push origin main --follow-tags
```

Pushing the `vX.Y.Z` tag triggers the `Release` workflow, which:

1. fails immediately if the tag name doesn't equal `v<package.json version>`;
2. runs the repository gates (source-JSON validity, `scripts/validate.js`, explorer build);
3. runs `npm run package` then `npm run package:release`;
4. creates the GitHub Release with generated notes and uploads every artifact plus
   `SHA256SUMS.txt`.

Everything is rebuilt from the tag — generated `build/` and `dist/` are never
committed, so a release never depends on local state.

### Dry run before tagging

Reproduce the release build from a clean checkout without publishing anything:

```sh
npm ci
npm run release:dry-run   # validate + npm run package + npm run package:release
ls dist/                  # native artifacts, Zed archive, all-formats ZIP, SHA256SUMS.txt
```

Requires `node`, `python3`, a JDK (17+) and Gradle (9+) for the IntelliJ build, and
system `zip`/`tar`. CI installs these; install them locally for a full dry run.

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
each update) can run. Do these once, then hand control to the workflow above.

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

### Zed (manual, every version)

No non-interactive publisher. Publishing and each update is a PR to
<https://github.com/zed-industries/extensions>:

1. Add the theme repo as an **HTTPS** git submodule under `extensions/candela-themes`.
2. Add a top-level `extensions.toml` entry with the `id` and `version`, run
   `pnpm sort-extensions`, and open the PR. On merge, Zed's CI packages and publishes.
3. The extension `id` (`candela-themes`) is permanent. The repo must include a
   license (required since 2025-10-01). For each release, bump `version` in
   `extensions.toml` in a new PR.

### Sublime Package Control (one-time listing, then tags)

No publisher; Package Control polls git tags. `npm version` already creates a semver
tag, so the listing needs setting up only once:

1. Fork <https://github.com/wbond/package_control_channel>, add a repository entry
   under `repository/` with the GitHub URL and `"tags": true`.
2. Run the ChannelRepositoryTools tests locally, open the PR, await human review.
3. After the listing is merged, every new `vX.Y.Z` tag is picked up automatically —
   no further PRs. (Branch-based releases are deprecated; tags are required.)
