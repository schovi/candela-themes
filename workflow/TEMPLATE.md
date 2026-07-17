# NNN — Title

priority: 20
depends: 041, 043
gate: <observable fact this waits on>
done: YYYY-MM-DD

Status is the folder this file sits in (`draft/`, `ready/`, `in-progress/`, `blocked/`, `done/`) — never a line in the file. Metadata lines directly under the title, keep only the ones the current folder needs: `priority:` in ready (sparse integers — 10, 20, 30 — lowest is next), `gate:` in blocked, `done:` added on completion. No YAML frontmatter. View the board with `./workflow/status`.

`depends: NNN[, NNN]` is optional and orthogonal to status: list other task IDs this one needs shipped first. Prefer slicing tasks so they deliver independently (no `depends:` at all); add the line only for a real code/data dependency. `/work` refuses to start a task whose dependencies aren't in `done/`. It differs from `gate:` — `gate:` is an external fact that parks a task in `blocked/`; `depends:` is a task-to-task edge that can ride in `ready/`.

## What & why

2–6 lines: the outcome, the user-visible change, why now. Tiny drafts can stop after Acceptance criteria until they move to Ready.

## Spec

Only what implementation needs: exact behavior and edge cases. Pseudo-code welcome.

Before moving to `ready/`, use bounded codebase reconnaissance to confirm this is one cohesive, independently deliverable outcome sized for one `/work` loop. In Spec or Notes, record a compact implementation boundary: expected production ownership surfaces, likely tests and routed docs, known load-bearing contracts, and explicit exclusions. Omit categories with nothing material rather than adding empty boilerplate. Split independently verifiable outcomes into separate tasks.

## Acceptance criteria

- Observable checks, one per line. These are what "done" means. Required to leave `draft/`.

## Notes

Optional, brief: surprises, follow-ups, decisions logged (`D<N>`). Not an execution log — git history is the execution log.
