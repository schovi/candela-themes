# 011 — Retire docs/design-handover/

done: 2026-07-17
depends: 008, 009

## What & why

`docs/design-handover/` was the original design drop. With the explorer app (009)
replacing the `.dc.html` showcases and the accessibility pass (008) done, retire the
folder: move the source of truth to `themes/aurora-themes.json`, migrate every rule and
token role into `AGENTS.md` + root `README.md`, delete the rest, and remove all live
references.

## Spec

**Move.** `git mv docs/design-handover/aurora-themes.json themes/aurora-themes.json`.
Update every consumer: `scripts/generate.js`, `scripts/validate.js`, the `app/` JSON
import, and path mentions in living docs.

**Migrate content of `docs/design-handover/README.md`** (don't lose anything, don't
duplicate — cross-link per `docs/style.md`):
- Token reference (ui/syntax/diagnostics roles) and the "Design rules to preserve"
  invariants → root `AGENTS.md` (agent-facing contract).
- User-facing material (why-light-themes rationale incl. the 008 corrections, theme
  table details, generator/how-to-use docs) → root `README.md`, keeping links to
  `docs/vision-research.md` for the research.
- The standard theme-change loop (edit JSON → validate → generate → eyeball) → `AGENTS.md`,
  with "eyeball the showcase" now meaning the `app/` explorer.

**Delete** the remaining files: `Aurora Light Themes.dc.html`, `Sample.dc.html`,
`support.js`, the migrated `README.md`, then the empty folder.

**Update references** in living files (recon list): root `README.md`, root `AGENTS.md`,
`workflow/AGENTS.md` (project one-liner, validation commands, doc-routing table — route
`themes/aurora-themes.json` edits to the migrated rules' new home), `docs/vision-research.md`,
`docs/screenshots/README.md`. Leave `workflow/done/*` and `workflow/reports/*` untouched —
they're historical records. Re-grep `design-handover` at the end; only history may match.

Boundary — production surfaces: `themes/` (new home), `scripts/*.js` paths, `app/` import
path, root `README.md`, root `AGENTS.md`, `workflow/AGENTS.md`, `docs/vision-research.md`,
`docs/screenshots/README.md`, deletion of `docs/design-handover/`.
Exclusions: no color/rule changes, no generator/emitter changes, no `dist/` diff beyond
what regeneration from the moved (identical) JSON produces — expected byte-identical.

## Acceptance criteria

- `docs/design-handover/` no longer exists; `themes/aurora-themes.json` is the source of
  truth and `python3 -m json.tool`, `node scripts/validate.js`, `node scripts/generate.js`
  all pass against it; regenerated `dist/` is unchanged.
- Explorer app still renders and the screenshot command still works after the path move.
- `grep -r design-handover` matches only `workflow/done/`, `workflow/reports/`, and git
  history — no living doc or script.
- Every token role, invariant, and the theme-change loop previously in
  `docs/design-handover/README.md` is findable in root `AGENTS.md` / `README.md` (spot-check:
  an agent following only AGENTS.md can execute a theme change end to end).
- `workflow/AGENTS.md` doc routing and validation commands reference the new paths.

## Notes

depends: 008 (it edits design-handover files — must land before they move) and 009 (the
app must exist before the showcases it replaces are deleted). Runs before 010 by
priority so the playground is built on the final layout — flip 010/011 priorities if the
playground is wanted sooner.
