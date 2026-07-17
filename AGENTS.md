# Aurora Themes

A set of 14 light color themes for terminals and editors, tuned for eye-strain comfort.
`docs/design-handover/aurora-themes.json` is the single source of truth; see
`docs/design-handover/README.md` for token roles and design invariants.

## Work tracking

Managed by the `workflow` plugin. Tasks are files in `workflow/<status>/`
(draft, ready, in-progress, blocked, done) — the folder IS the status;
moving a task is `git mv`. Board view: `./workflow/status`. Repo contract:
`workflow/AGENTS.md`. Commands: `/workflow:groom`, `/workflow:work`,
`/workflow:batch-work`, `/workflow:status`, `/workflow:framework-doctor`.
