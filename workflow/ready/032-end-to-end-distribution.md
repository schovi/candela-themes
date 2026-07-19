# 032 — End-to-end release distribution

priority: 10

## What & why

Turn the generated packages into a repeatable public release. A maintainer should be
able to choose an `X.Y.Z` version once, produce a matching `vX.Y.Z` GitHub release
with every manual-install artifact, and publish supported editor packages after the
required marketplace accounts have been registered.

## Spec

Use the root package version as the release version. Document a Homebrew-style
maintainer flow based on `npm version X.Y.Z`, so `package.json`, `package-lock.json`,
the release commit, and `vX.Y.Z` tag advance together. The release automation must
reject a tag/version mismatch before building or publishing.

Add a CI-gated GitHub release workflow for version tags. It installs locked
dependencies, runs the repository validation gates and aggregate package command,
then publishes:

- every native artifact already produced under `dist/`;
- an archive for Zed rather than only the current directory output;
- one all-formats ZIP with a short artifact/install index;
- a checksum manifest covering uploaded files;
- generated release notes.

The release must be reproducible from the tag and must not depend on ignored local
`build/` or `dist/` state. Keep artifact names suitable for direct download. Verify
whether stable, version-independent aliases are needed for candela.ink links; use the
GitHub latest-release page when an alias would duplicate artifacts or weaken version
traceability.

Cover the supported discovery channels end to end:

- VS Code Marketplace, and verify whether Open VSX should receive the same VSIX;
- JetBrains Marketplace;
- Zed's extension registry submission flow;
- Sublime Package Control;
- GitHub Releases as the canonical channel for Neovim, Helix, and terminal formats,
  unless reconnaissance finds an established official registry that fits them.

Automate repeat marketplace updates where the platform has a supported non-interactive
publisher. Put credentials behind named GitHub environments or repository secrets and
require an explicit publish action or protected environment approval, so ordinary tags
cannot leak credentials or accidentally submit packages. Do not upload or submit the
initial release while implementing this task.

Write a maintainer runbook for every first submission. It must name prerequisites,
account/vendor or repository registration, metadata and assets to prepare, secrets to
configure, the exact manual submission or approval steps, how to verify the listing,
and how to hand control back to the automated update path. Clearly distinguish stores
from manual-download-only consumers and record any review delay or immutable identifier.

Add a concise download/install surface to candela.ink and the root README. It should
link to the latest GitHub release for manual downloads and to live marketplace listings
once their identifiers exist. Before initial publication, links must not point to fake
or placeholder listings.

Expected ownership surfaces are root release/package metadata and scripts, GitHub
Actions release workflows, generated marketplace manifests where identifiers or
versioning require them, the root README plus a focused release runbook, and the app's
download/install links. Likely tests are tag/version mismatch, clean-checkout packaging,
artifact inventory and checksums, all-formats archive contents, dry-run marketplace
publishing, app build, and the existing JSON/theme gates. Preserve the zero-runtime-
dependency generator and keep generated `build/` and `dist/` files uncommitted.

Initial account creation, accepting marketplace agreements, supplying secrets, manual
review approval, and making a real public release are explicit external maintainer
actions. Changing theme colors or adding new consumer formats is excluded.

## Acceptance criteria

- One documented `X.Y.Z` preparation flow updates package metadata and creates the
  matching `vX.Y.Z` tag; release CI fails clearly when tag and package version differ.
- A clean-checkout dry run passes validation, builds every package, and produces the
  complete native-artifact inventory, a Zed archive, one indexed all-formats ZIP, and a
  checksum manifest without relying on ignored local files.
- A version tag can create a GitHub Release with generated notes and all expected assets;
  workflow permissions are minimal and publication is gated on successful validation.
- Each supported marketplace or registry has either a safe automated update path or a
  documented reason it remains manual; no publish step can run accidentally during PR
  or ordinary branch CI.
- The first-submission runbook is actionable for VS Code, any selected Open VSX path,
  JetBrains, Zed, and Sublime Package Control, including account setup, immutable IDs,
  secrets, review/verification, and the transition to later automated updates.
- README and candela.ink direct users to GitHub Releases for manual downloads and expose
  only real marketplace links; the app build and repository validation gates pass.

## Notes

Decided with the user: semantic `X.Y.Z` releases, package metadata as version source,
native assets plus one all-formats ZIP and release notes, and initial marketplace
submission instructions without performing uploads. Publication behavior must be
checked against current official platform documentation during implementation.
