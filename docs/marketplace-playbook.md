# Marketplace playbook

The first-time walkthrough for getting Candela onto each editor marketplace. Do each
store's manual setup once, drop the credentials into GitHub, and every release after
that publishes itself. Nothing here touches a live listing until you dispatch it.

This is the narrative walkthrough; [`release-runbook.md`](release-runbook.md) is the
terse reference with the exact secret names and the per-release checklist. Facts about
automation (workflows, secrets, dist repos) live there — this file points at them
rather than restating them.

## Two kinds of channel

Three stores have a non-interactive publisher, so CI can push updates. Two are
pull-request registries with no API, so publishing there is always a manual step. That
split drives the whole plan.

- **Automated** — CI can publish updates after setup: VS Code, Open VSX, JetBrains.
- **Manual PR** — a pull request each version: Zed, Sublime Package Control.

**Start the slow one first.** JetBrains reviews the first version by hand and it can
sit for days. Submit it before the others so its review clock runs in the background.

## Order of operations

1. Confirm the prerequisites below — public repo, license, one real release, matching ids.
2. Create the GitHub `marketplace` environment once. It gates every automated publish
   behind your approval and is where the secrets live.
3. Submit JetBrains (slow manual review — get it in the queue).
4. Set up VS Code + Open VSX (fast; both publish the same `.vsix`).
5. Open the Zed and Sublime PRs (external review, but no clock pressure).
6. Hand off to automation — from here, releases and updates are near-hands-free.

## Step 1 · Prerequisites

1. **Repo is public with a committed `LICENSE`.** MIT is already in the tree. Zed
   *requires* a license (enforced since Oct 2025); the others expect one too.
2. **You've cut at least one release**, so the artifacts exist. Dispatch the `Release`
   workflow (see the runbook). The first uploads to VS Code / Open VSX / JetBrains use
   those exact files.
3. **You have the artifacts locally** for the manual first uploads:

   ```sh
   npm ci
   npm run release:dry-run   # writes everything to dist/
   ```

4. **The ids you register must match what the generator emits** — they're baked into
   the packages, don't invent new ones at the store:

   | Store | Identifier |
   | --- | --- |
   | VS Code | `candela` (publisher) · `candela-themes` (name) |
   | Open VSX | `candela` (namespace) |
   | JetBrains | `com.candela.themes` (plugin id) |
   | Zed | `candela-themes` (extension id) |

## Step 2 · The GitHub `marketplace` environment (do once)

Every automated publish job runs in this protected environment. That keeps credentials
out of ordinary PR / branch / tag CI and makes each publish wait for your approval.

1. Repo → **Settings → Environments → New environment** → name it exactly `marketplace`.
2. Add **Required reviewers** (yourself) and save. Now a publish run pauses until you
   approve it.
3. Add the secrets below as each store issues them (**Environment secrets**, not
   repo-wide).

The `Publish to marketplaces` workflow already declares `environment: marketplace` and
is `workflow_dispatch`-only — you don't edit any YAML, just fill this in.

## VS Code Marketplace — automated

The primary VS Code listing. Auth runs through Azure DevOps; the token is all CI needs.

1. Sign in to an **Azure DevOps** organization at <https://dev.azure.com> (any org —
   it's only used for authentication).
2. Create the publisher at <https://marketplace.visualstudio.com/manage>. **Permanent:**
   the publisher id must be exactly `candela`; it's reserved forever and can't be renamed.
3. Create a token: dev.azure.com → **User settings → Personal access tokens → New**.
   - Organization: **All accessible organizations**
   - Scopes: **Marketplace → Manage**
4. Store it as the `VSCE_PAT` secret in the `marketplace` environment.
5. First publish — dispatch the workflow:

   ```
   Actions → Publish to marketplaces → Run workflow
     ref: vX.Y.Z    ✓ vscode
   → approve the environment gate
   ```

   Or once, locally: `npx vsce login candela` then `npx vsce publish`.

**Expiry ahead:** classic Azure DevOps PATs retire **2026-12-01**. Plan to move to
Entra ID workload-identity federation (`vsce publish --azure-credential`) before then.

Verify: <https://marketplace.visualstudio.com/items?itemName=Candela.candela-themes>

Ongoing: re-run the workflow with `vscode` checked each release. Versions can't be reused.

## Open VSX — automated

The open registry used by VSCodium, Cursor, Gitpod and other non-Microsoft editors —
same `.vsix` as VS Code.

1. Sign in at <https://open-vsx.org> with an **Eclipse account** (create one if needed).
2. Sign the **Eclipse Publisher Agreement** — your profile prompts for it on first login.
3. Generate an access token (Profile → **Access Tokens**); it's shown once. Store it as
   the `OVSX_PAT` secret in the `marketplace` environment.
4. Reserve the namespace once:

   ```sh
   npx ovsx create-namespace candela -p <token>
   ```

   **Permanent:** namespace `candela` is the immutable id and must match the VS Code
   publisher.
5. First publish — dispatch the workflow with `openvsx` checked (it reuses the built
   vsix). New uploads show as "Deactivated" for ~10s while they process.

Owning the namespace isn't the same as the verified-owner badge — that's a separate
claim you can request later.

Verify: <https://open-vsx.org/extension/candela/candela-themes>

Ongoing: same workflow, `openvsx` checked, each release.

## JetBrains Marketplace — automated after approval

IntelliJ, PyCharm, WebStorm and the rest. The first version is hand-reviewed; updates
after that go through the API.

**Do this first:** the first version is manually moderated before it goes live — it can
take days.

1. Sign in at <https://plugins.jetbrains.com> with a JetBrains account.
2. Upload the first version through the web UI at <https://plugins.jetbrains.com/plugin/add>
   → upload `dist/candela-themes-intellij-<version>.zip`.
3. Wait for approval, then grab the numeric plugin id from the listing URL and store it
   as the `JETBRAINS_PLUGIN_ID` secret.
4. Create a permanent token: profile → **My Tokens** → generate. Store it as the
   `JETBRAINS_TOKEN` secret in the `marketplace` environment.
5. Later versions — dispatch the workflow with `jetbrains` checked. Updates to an
   approved plugin publish via the API with no re-review.

**Permanent:** the plugin id `com.candela.themes` and the numeric id are fixed once live.

Ongoing: workflow with `jetbrains` checked; no review on updates.

## Zed extension registry — manual PR

Zed's registry has no publisher API. Every listing and update is a pull request.

Zed pulls your extension as a **git submodule**, so it needs a public repo with the
built `extension.toml` + `themes/candela.json` at its root. This repo keeps `build/`
uncommitted, so the generated `build/zed/` is republished to the dedicated
`candela-themes-zed` dist repo (synced automatically by the Release workflow — see the
runbook), tagged per release.

1. Fork <https://github.com/zed-industries/extensions>.
2. Add `candela-themes-zed` as an **HTTPS** submodule under `extensions/candela-themes`
   (HTTPS, not SSH — CI can't use SSH), pinned at the release tag.
3. Add a top-level `extensions.toml` entry:

   ```toml
   [candela-themes]
   submodule = "extensions/candela-themes"
   version = "X.Y.Z"
   ```

4. Run `pnpm sort-extensions`, commit, and open the PR. On merge, Zed's CI packages and
   publishes it.

**Permanent:** the extension id `candela-themes` is fixed.

Ongoing: each release, bump the submodule to the new tag and `version` in
`extensions.toml` in a new PR.

## Sublime Package Control — manual listing, then tags

No publisher — Package Control polls your git tags. You register the package once, then
new tags flow automatically.

Package Control installs your tagged repo contents, but the `.sublime-color-scheme`
files are generated (uncommitted). They're republished to the dedicated
`candela-themes-sublime` dist repo, which the Release workflow tags every release (see
the runbook).

1. Fork <https://github.com/wbond/package_control_channel>.
2. Add a repository entry under `repository/` pointing at `candela-themes-sublime` with
   `"tags": true`.
3. Run the **ChannelRepositoryTools** tests locally to validate the entry.
4. Open the PR and wait for the human review.

Branch-based releases are deprecated — semver **tags** are required. CI already creates
them on the dist repo.

Ongoing: after the listing merges, each new `vX.Y.Z` tag is picked up automatically —
no more PRs.

## Handoff to automation

Once the secrets are in the `marketplace` environment and the first listings exist, the
recurring release is short:

1. Cut the release (dispatch the `Release` workflow — see the runbook). The tag builds
   the GitHub Release and every artifact, and syncs the Zed/Sublime dist repos.
2. Push the store updates that automate: Actions → `Publish to marketplaces` → pick the
   tag, check VS Code / Open VSX / JetBrains → approve the gate.
3. The two manual ones: Zed is a one-line `version` bump PR; Sublime needs nothing — it
   follows the new tag.

GitHub Releases stays the canonical channel for Neovim, Helix, and the terminal formats
— no registry to register there. The README and candela.ink link to `releases/latest`;
add each marketplace link once its listing is live.
