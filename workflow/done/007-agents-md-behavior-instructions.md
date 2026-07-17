# 007 — AGENTS.md agent-behavior instructions

done: 2026-07-17

## What & why

`AGENTS.md` currently states only what the project is and how work tracking works. Agents
(and humans) adding or editing a theme have no written contract for *how* to do it safely:
which file is canonical, which invariants must survive, how to regenerate and validate. This
task extends `AGENTS.md` into that contract so any agent picking up theme work behaves
consistently. `CLAUDE.md` already routes to it via `@AGENTS.md` — confirm and keep that link.

## Spec

Extend `AGENTS.md` (don't create a parallel file) with an agent-behavior section covering:
- **Source of truth**: `docs/design-handover/aurora-themes.json` is the only place colors are
  authored. Never hand-edit generated `dist/` files — regenerate.
- **Design invariants to preserve** (link, don't duplicate, the full list in
  `docs/design-handover/README.md`): no pure white/black, ink AAA ≥7:1, 6–8 desaturated hues,
  every token in every theme, blue+orange carry meaning.
- **Standard loop for a theme change**: edit JSON → `node scripts/validate.js` →
  `node scripts/generate.js` → eyeball the `.dc.html` showcase → commit. (Reference tasks 001/005
  for the scripts; if those aren't done yet, say so rather than inventing commands.)
- **How to add a 15th theme / new format**: what must be filled in, what regenerates automatically.
- **Showcase workflow**: `.dc.html` files are CSS-variable-driven previews; how to view/screenshot.
- Keep it short, cross-link to `docs/design-handover/README.md` and `docs/style.md`; follow the
  repo doc-style rules (one job per file, cross-link don't duplicate, no execution logs).

Boundary:
- Production surface: `AGENTS.md` (root). Verify `CLAUDE.md` still contains `@AGENTS.md` and fix
  if not.
- Docs: this IS the doc change; cross-link rather than restate the README.
- Exclusions: don't touch `workflow/AGENTS.md` (that's the plugin contract, separate concern) —
  except the validator/generator commands, which are owned by tasks 001/005's own doc updates.

## Acceptance criteria

- `AGENTS.md` has an agent-behavior section covering source of truth, invariants (linked),
  the edit→validate→generate→eyeball→commit loop, adding a theme/format, and the showcase.
- `AGENTS.md` cross-links to `docs/design-handover/README.md` and `docs/style.md` instead of
  duplicating their content.
- `CLAUDE.md` references `AGENTS.md` (verify the `@AGENTS.md` line is intact).
- No execution logs or restated content — passes the repo doc-style rules.

## Notes

Independent — no code dependency. Reads cleanest after 001/005 exist so the referenced commands
are real, but can ship before them by phrasing the loop as the intended commands. No `depends:`.
