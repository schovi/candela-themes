# NNN — Title

priority: 20
depends: 041, 043
tags: api, ui-polish
model: sonnet
gate: <observable fact this waits on>
done: YYYY-MM-DD

Status is the folder this file sits in (`draft/`, `ready/`, `in-progress/`, `blocked/`, `done/`) — never a line in the file. Metadata lines directly under the title, keep only the ones the current folder needs: `priority:` in ready (sparse integers — 10, 20, 30 — lowest is next), `gate:` in blocked, `done:` added on completion. No YAML frontmatter. View the board with `./workflow/status`.

`tags: a, b` is optional and works in any folder: comma-separated lowercase slugs (`[a-z0-9-]`) for searching and grouping — an area, surface, or theme (`api`, `board-ui`, `docs`). Reuse a tag already on the board instead of coining a synonym (`./workflow/status --tags` lists the vocabulary in use with counts); a tag used once groups nothing. Not a status, not a priority, not a dependency. Filter with `./workflow/status --tag api` (repeat `--tag` to AND them), or click the tag chips in the dashboard.

`model: haiku|sonnet|opus` is optional: which model tier `/workflow:batch-work` should dispatch this task's worker on. Omit it — the default — and the worker inherits the session's model, which is the right answer for anything with a design call in it. Set it only when the task is genuinely mechanical (a doc sync, a rename, a config bump) and the cheaper tier can finish it without a second pass; a downgrade that causes a re-run costs more than it saved. `/workflow:work` ignores the line: it runs in the session's own context, so only batch dispatch can act on it.

`depends: NNN[, NNN]` is optional and orthogonal to status: list other task IDs this one needs shipped first. Prefer slicing tasks so they deliver independently (no `depends:` at all); add the line only for a real code/data dependency. `/work` refuses to start a task whose dependencies aren't in `done/`. It differs from `gate:` — `gate:` is an external fact that parks a task in `blocked/`; `depends:` is a task-to-task edge that can ride in `ready/`.

## What & why

2–6 lines: the outcome, the user-visible change, why now. Tiny drafts can stop after Acceptance criteria until they move to Ready.

## Spec

Only what implementation needs: exact behavior and edge cases. Pseudo-code welcome.

Before moving to `ready/`, use bounded codebase reconnaissance to confirm this is one cohesive, independently deliverable outcome sized for one `/work` loop. In Spec or Notes, record a compact implementation boundary: expected production ownership surfaces, likely tests and routed docs, known load-bearing contracts, and explicit exclusions. Omit categories with nothing material rather than adding empty boilerplate. Split independently verifiable outcomes into separate tasks.

## Acceptance criteria

- Observable checks, one per line. These are what "done" means. Required to leave `draft/`.

## Open questions

Draft-only, and only when something genuinely blocks Ready: the specific questions that must be answered before this can be groomed to `ready/` (one per line). Delete the section when the task moves to `ready/` — an open question surviving into Ready is a bug, `/work` would have to guess it.

## Notes

Optional, brief: surprises, follow-ups, decisions logged (`D<N>`). Not an execution log — git history is the execution log.
