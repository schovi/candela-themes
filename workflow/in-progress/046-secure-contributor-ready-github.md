# 046 — Establish secure, contributor-ready GitHub defaults

priority: 10

## What & why

The public repository has strong CI and secret scanning, but `main` is unprotected,
dependency and code scanning are incomplete, marketplace credentials lack the
documented approval gate, and GitHub reports only 42% community-profile coverage.
Establish one minimal governance baseline that protects releases without deadlocking
the sole maintainer and gives outside contributors a clear path from issue to merge.

## Spec

- Configure GitHub-owned repository settings, not just documentation. Protect `main`
  with pull requests, the non-strict `validate-and-build` check, resolved conversations,
  linear history, and force-push/deletion prevention. Require zero approvals until a
  second maintainer exists. Allow only the GitHub Actions actor to bypass the ruleset so
  the existing CI-driven version commit and tag push continues to work; keep the default
  workflow token read-only and write permission local to the release workflow.
- Tighten Actions and supply-chain inputs. Pin every referenced action to a full commit
  SHA, allow only the action publishers this repository uses, require SHA pinning, and
  replace the marketplace workflow's runtime `ovsx` download with a locked development
  dependency and local invocation. Add quiet weekly Dependabot version updates for the
  root npm project, the explorer, and GitHub Actions.
- Enable Dependabot alerts and security updates, CodeQL default setup for JavaScript and
  TypeScript, private vulnerability reporting, and security-alert notifications. Keep
  the existing secret scanning, push protection, read-only Actions token default, and
  first-time-contributor workflow approval policy.
- Make the `marketplace` environment match the release contract: accept only `v*` tags,
  require the sole maintainer's approval, permit self-review while there is only one
  maintainer, and prevent administrative bypass. Run marketplace publishing on the
  release tag as the workflow ref, not merely as a checkout input, so the environment's
  tag policy is meaningful. Enable immutable releases and protect `v*` tags from update
  or deletion.
- Add the standard community entry points: one concise contribution guide, security
  policy, Contributor Covenant, bug and theme/format request templates, a private
  security-report link, and a compact pull-request checklist. Make the contribution
  guide the source of truth for setup, authored versus generated files, validation,
  screenshots, and pull-request expectations; leave only a short link in the README.
- Use simple merge and discovery settings: disable merge commits, keep squash and rebase,
  enable auto-merge, update-branch suggestions, and automatic branch deletion; keep
  Issues and blank issue submissions enabled; disable the unused Wiki and Projects;
  leave Discussions off; add focused theme, editor, terminal, and accessibility topics.
- Ownership surfaces are GitHub repository settings, `.github/`, the root dependency
  manifest and lockfile, root community documents, the README contribution entry point,
  and the release runbook. Preserve the runbook's CI-driven release ordering and the
  invariant that a failed build never creates a remote tag.
- Exclude signed-commit enforcement, merge queues, CODEOWNERS enforcement, multiple
  approvals, custom secret patterns, and new automation beyond GitHub's native features.

## Acceptance criteria

- Ordinary actors cannot push, force-push, or delete `main`; pull requests require the
  current validation check and resolved conversations, while the release workflow still
  has the narrow access needed to push its validated version commit and tag.
- Actions use reproducible, allowlisted dependencies, the marketplace CLI comes from the
  lockfile, and required CI passes after the workflow and dependency changes.
- GitHub's security overview shows dependency alerts and updates, CodeQL, private
  reporting, secret scanning, and push protection active without setup failures.
- Marketplace credentials are available only to approved `v*` deployments, and a
  published release plus its version tag cannot be changed or deleted.
- GitHub's community profile and repository entry points expose clear contribution,
  conduct, security, issue, and pull-request guidance that matches the repository's real
  commands and generated-file rules.
- Merge, cleanup, issue, discovery, Wiki, Project, and Discussion settings match the
  minimal single-maintainer policy in this task and are verified through GitHub's API.

## Notes

`docs/release-runbook.md` already records why branch protection needs an Actions bypass.
When a second active maintainer joins, follow up by requiring one approval and preventing
self-review of marketplace deployments.

BLOCKER (see D8): `main` branch protection could not be applied. On this user-owned
(non-org) repo GitHub rejects a GitHub Actions ruleset bypass (`422 "Actor GitHub Actions
integration must be part of the ruleset source or owner organization"`), so an active
`main` ruleset would break the CI-driven release push. `main` protection is deferred
pending a human decision: org migration, release-PR model, or a PAT-based admin bypass.
Immutable releases has no stable REST endpoint on this account — enable it once in repo
Settings by hand (the `v*` tag ruleset already blocks tag update/deletion). Everything
else in the spec is applied.
