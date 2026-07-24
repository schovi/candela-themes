# 056 — Harden validation display plumbing against rules drift

done: 2026-07-24

## What & why

The export gate is sound (same lib/rules.js module as the CLI — parity verified), but
three display-layer couplings silently degrade if rules.js evolves, and one import check
has a hole. Low urgency, cheap insurance.

## Spec

- app/src/Playground.tsx:76-81 `CONTRAST_CHECKS` hard-duplicates the AA token list from
  lib/rules.js:23 — export the list from rules.js and consume it, so a new token can't be
  gated but missing from the contrast table.
- Playground.tsx:89 `explainRuleMessage` / :126 `jumpTokenForMessage` regex-parse rule
  message strings — add a small unit check (or structured rule ids) so a reworded message
  fails loudly instead of silently dropping the jump/explanation.
- `validImportedTheme` (Playground.tsx:290-295) doesn't validate `id` — accept-and-ignore
  is fine, but normalize it on import (slugify(name)) so draft.id is never undefined.
- Verify whether the editor should also run `checkAnsiMapping`; today it can't apply to a
  single draft (mapping lives at the JSON top level) — if so confirmed, skip with a
  one-line note in the task on completion.
- Boundary: app/src/Playground.tsx display plumbing, lib/rules.js exports only (no rule
  behavior change). Gate semantics must stay byte-identical.

## Acceptance criteria

- The contrast table's token list is imported from lib/rules.js, not duplicated.
- A reworded rule message can't silently break token-jump/explanations (test or structured ids prove it).
- Imported/shared drafts always end up with a defined, slugified id.
- `node scripts/validate.js` output unchanged for the shipped themes file.

## Notes

- `checkAnsiMapping` is not run in the editor: the editor edits a single draft
  theme, and `ansiMapping` lives only at the JSON top level (themes.ts reads
  `themeData.ansiMapping`), never per-theme. A draft has no mapping to check, so
  there is nothing to apply. Confirmed skip.
