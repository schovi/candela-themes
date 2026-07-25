# Decisions

Append-only decision log. One entry per decision, stable `D<N>` handle. Newest at the bottom.
Written by `/workflow:decision`.

## D1 — Explorer is a static multi-page app, no SPA router (2026-07-18)

**Problem.** The explorer goes public on Cloudflare Pages (task 020) and needs real
pages (home, gallery, lab) with shareable URLs, replacing the single-page `<select>`
view switcher.

**Options.** (A) SPA with react-router and client-side routes. (B) Static multi-page
Vite build: one real HTML file per route (`index.html`, `themes.html`, `lab.html`),
cross-page nav via plain `<a href>`, interactivity staying client-side React within a
page.

**Choice.** B. Hosting stays a plain static serve — Cloudflare Pages maps `themes.html`
to `/themes`, so no SPA fallback or rewrite rule is needed, and fragment anchors
(`/themes#<id>`) handle in-page targets. No routing dependency in `app/package.json`.
A dev/preview Vite middleware rewrites `/themes` → `/themes.html` so local URLs match
production. Deliberate: do not add react-router or any router to "clean this up".

## D2 — Theme-building tools live on separate pages, not one Lab page (2026-07-18)

**Problem.** The two theme-building tools (Theme Editor + Theme Builder) were stacked on
one `/lab` page (task 023). That made the page long to scan and gave neither tool a clean
URL for nav and cross-links.

**Options.** (A) Keep both on one `/lab` page, linked by in-page anchors (the 023 layout).
(B) Split into two static pages — `/editor` (Theme Editor) and `/builder` (Theme Builder) —
mirroring the existing `themes`/`lab` page pattern (`.html` + `*.entry.tsx` + rollup input +
clean-URL rewrite), with two distinct nav items.

**Choice.** B (task 024), superseding the 023 single-page decision. Each tool now has its own
URL for nav and deep-linking; `/lab` is removed (the site was not yet deployed, so no live URL
needed preserving). Stays within D1 — still a static multi-page Vite build, no router. If the
two tools ever need to be seen side by side, this is the choice to revisit.

## D3 — Host the explorer on Cloudflare Pages, git-integration, validation-gated (2026-07-19)

**Problem.** The explorer should be browsable at a public URL without cloning, and a
broken source-of-truth JSON or a broken app build must never publish.

**Options.** (A) Cloudflare Pages with git integration: push to `main` builds and
deploys, PR previews for free. (B) GitHub Actions building and deploying via
`wrangler pages deploy` (or GitHub Pages). (C) Any new static host (Netlify, Vercel).

**Choice.** A, at **candela.schovi.cz** (task 020). The schovi.cz zone already lives on
Cloudflare (zero new vendors), the site is fully static, and git integration is the
simplest publish path with PR preview URLs included. The Pages build command runs
`node ../scripts/validate.js && npm run build` so a failed invariant aborts the deploy;
GitHub Actions CI runs the identical gate pre-merge. Deploys stay owned by Cloudflare —
no Actions-owned deploy step to maintain or authenticate.

## D4 — Canonical domain is candela.ink; candela.schovi.cz redirects (2026-07-19)

**Problem.** D3 shipped the explorer on candela.schovi.cz, a personal subdomain. The
project deserves its own name, and two live URLs would split links and search results.

**Options.** (A) Keep candela.schovi.cz as canonical. (B) Buy a project domain, make it
canonical, 301-redirect the old subdomain. (C) Serve both with no redirect.

**Choice.** B: **candela.ink** (bought on Cloudflare Registrar — `ink` is literally the
set's primary text token). Attached to the same Pages project (proxied apex CNAME);
candela.schovi.cz stays attached and 301-redirects with path preserved via
`app/public/_redirects` (a zone redirect rule was blocked by API token permissions; the
`_redirects` file is repo-versioned, which is better anyway). All docs and the GitHub
homepage point at candela.ink only.

## D5 — Theme building is one persisted tool with Simple and Pro modes (2026-07-19)

**Problem.** Separate Editor and Builder pages created two drafts, duplicated previews and
validation, and made users choose a tool before they understood the difference.

**Options.** (A) Keep `/editor` and `/builder` separate as chosen in D2. (B) Put both editing
surfaces over one draft on `/editor`, with Simple and Pro modes and a redirect from the old
Builder URL.

**Choice.** B, superseding D2. One persisted working draft now moves between guided Simple
controls and per-token Pro controls. `/builder` redirects permanently to `/editor`. This
keeps D1's static multi-page architecture and does not add a client-side router.

## D6 — Download links use GitHub `releases/latest`, no candela.ink aliases (2026-07-20)

**Problem.** The download surface on candela.ink and the README needs stable,
version-independent links to release artifacts. Option: mint our own aliases on
candela.ink that always point at the newest files.

**Options.** (A) Host version-independent alias URLs on candela.ink that redirect to or
mirror the newest artifacts. (B) Link straight to GitHub's built-in
`…/releases/latest` and `…/releases/latest/download/<asset>` URLs.

**Choice.** B. GitHub already serves stable, version-independent latest-release URLs, so
an alias would either duplicate artifacts (drift risk) or add redirect plumbing for no
gain, and mirroring would weaken version traceability. The README and app link to
`releases/latest`; no artifacts are mirrored under candela.ink.

## D7 — Naming: `candela` is the brand, `candela-themes` is the product (2026-07-20)

**Problem.** Identifiers mixed bare `candela` and `candela-themes` (and one stray singular
`candela-themes-theme` / `candela-theme-explorer`), with no rule for which to use where.
Question raised: rename the whole project to just `candela`.

**Options.** (A) Collapse everything to bare `candela`. (B) Keep the split and write it
down: `candela` for the owner/brand, `candela-themes` for the product.

**Choice.** B. `candela` is the **brand/owner** — VS Code publisher, Open VSX namespace,
JetBrains group `com.candela`, vendor/authors, and the candela.ink domain. `candela-themes`
(always plural) is the **product** — repo, all store listings and package/plugin/extension
ids. Bare `candela` for the product was rejected: the VS Code listing would stutter to
`candela.candela`, a card just named "Candela" hurts search discoverability, and generic
single-word ids collide more easily, for no real gain. Display name is **"Candela Themes"**
everywhere (dropped "Candela Light Themes" — inaccurate now that 2 dark themes ship).
Settled before first publish, while every marketplace id is still mutable.

## D8 — `main` branch protection deferred; a user repo can't grant Actions a ruleset bypass (2026-07-24)

**Problem.** Task 046 asked to protect `main` (require PRs, the `validate-and-build`
check, resolved conversations, linear history, no force-push/deletion) while letting
**only** the GitHub Actions actor bypass, so the CI-driven release push (bump commit +
tag straight to `main`) keeps working.

**Options.** (A) Ruleset on `main` with a GitHub Actions bypass actor — the spec's
intent. (B) Ruleset on `main` with no bypass — protects `main` but breaks the release
push. (C) Defer `main` protection until a bypass path exists.

**Choice.** C. The GitHub Actions bypass (`actor_type: "Integration"`, app id 15368)
is rejected on this repo: `422 "Actor GitHub Actions integration must be part of the
ruleset source or owner organization"`. On a **user-owned** (non-org) repo there is no
native way to grant the release token a ruleset bypass, and no other native actor
covers the `github-actions[bot]` push. Option B was rejected because breaking the
documented CI release contract is worse than an unprotected `main`. Everything else in
046 ships: the `v*` **tag** ruleset (blocks tag update/deletion), the `marketplace`
environment (approval, `v*` tag policy, no admin bypass), Actions allowlist + SHA
pinning, Dependabot/CodeQL/private reporting, and the community entry points. To finish
`main` protection later, pick one: move the repo into an org (then the Actions bypass
works), switch to a release-PR model, or push releases with a fine-grained PAT added as
an admin bypass actor. Related: **immutable releases** has no stable REST endpoint on
this account — enable it once in repo Settings by hand; the tag ruleset already covers
tag immutability.

## D9 — One copy module with three lengths; mode-neutral voice (2026-07-25)

**Problem.** The Candela pitch was authored three times and had already drifted:
`lib/emitters.js` `DESCRIPTION`, the template in `docs/marketplace-listing.md`, and
`app/index.html`'s `<meta name="description">` each said it differently. Surfaces with
hard length limits truncated copy written for unlimited ones — the JetBrains plugin card
cut the 190-char description mid-clause at "...desaturated accents," (char 102). The
brand line, `Light, measured for tired eyes.`, also excluded the two dark themes.

**Options.** (A) One string everywhere, front-loaded, accept truncation. (B) One module
exporting several lengths; each surface picks the one that fits. (C) Hand-written copy
per marketplace.

**Choice.** B. [`lib/copy.js`](../lib/copy.js) exports `TAGLINE` (brand line),
`SUMMARY` (front-loaded store one-liner), `DESCRIPTION` (long form), and `WHY_CANDELA`.
`DESCRIPTION` must open with `SUMMARY` verbatim, so a truncating surface always cuts
after a complete sentence; constrained surfaces (Zed, the JetBrains card, the GitHub
repo description, `og:description`) take `SUMMARY` and never truncate at all. C was
rejected as the state we were already in by accident. `scripts/validate.js` gates the
caps, the no-theme-counts rule, the mode-neutral rule, and drift between the module and
the static `<meta>` tags in `app/*.html` and the README tagline, which cannot import it.

The voice is now **comfort-first and mode-neutral**: the brand line is
`Color, measured for tired eyes.` and no tagline or page title presents Candela as a
light-only set. `docs/marketplace-listing.md` stopped carrying wording and became a
routing table (which variant goes where, which generated file to paste, per-store caps
with their sources).

## D10 — Release chains delivery via `workflow_call`; the split is by reversibility, not by tool (2026-07-25)

**Problem.** `Release` cut the tag and synced the Zed/Sublime dist repos;
`Publish to marketplaces` pushed VS Code, Open VSX and JetBrains. Both were
`workflow_dispatch`-only with every marketplace input defaulting to `false`. So a
release shipped a tag while the stores silently stayed on the previous version until
someone remembered a second dispatch, and the line between the two workflows read as
arbitrary (why are Zed and Sublime in one and VS Code in the other?).

**Options.** (A) Merge everything into `release.yml`. (B) Keep two workflows, chain
them: `release.yml` calls `publish.yml` via `workflow_call`. (C) Keep them separate and
just document harder that publishing is a second step.

**Choice.** B. A is wrong because the halves differ in reversibility (a GitHub Release
can be deleted and re-tagged; a version published to VS Code Marketplace, Open VSX or
JetBrains is burned permanently), credential blast radius (the release job must never
hold store tokens), failure semantics (three third-party APIs fail for reasons a
correct build cannot prevent) and retry granularity. C is the status quo that produced
the drift. Chaining gets delivery-by-default without giving up any of the four.

`workflow_call` specifically, not `gh workflow run` from a release step: a
`workflow_dispatch` fired with `GITHUB_TOKEN` does not start a new run, so dispatching
would have meant introducing a PAT.

Two consequences worth knowing:

- The old file's name was a lie once the dist-repo sync moved in, so
  `publish-marketplaces.yml` became `publish.yml` (`Publish`). Jobs are now grouped by
  reversibility: `dist-repos` (git pushes to repos we own) runs with no environment and
  no approval; `vscode`/`openvsx`/`jetbrains` stay in the protected `marketplace`
  environment behind a required reviewer.
- A called workflow inherits the **caller's** ref, so the `marketplace` environment's
  deployment policy had to accept `main` alongside `v*` (amending the policy described
  in D8). The tag policy was never the real protection — the required reviewer is, and
  it is unchanged. Artifacts are still built from the tag: `release.yml` passes the tag
  it just pushed as `publish.yml`'s `ref` input, so a delivery never publishes main's
  HEAD.

Every channel input now defaults to `true`, and each job warn-skips when its credential
secret is absent, so a not-yet-registered store cannot turn a good release red.
