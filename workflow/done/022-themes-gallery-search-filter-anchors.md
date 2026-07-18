# 022 — Themes gallery: search, filters, per-theme anchors

done: 2026-07-18

depends: 021

## What & why

Give the public site a browsable `/themes` page: every theme with a top filter bar
(fulltext search by name / font / tone, plus selects for light-vs-dark and tone) and stable
per-theme anchors so any theme is directly linkable (`/themes#lagoon`). Light/dark filtering
needs a real signal the source of truth lacks today, so add an explicit `mode` field.

## Spec

- **Add `mode` to the source of truth.** Every entry in `themes/aurora-themes.json` gets
  `mode: "light" | "dark"` (14 light; `nocturne` + `borealis` dark). Nothing implicit — all
  16 filled in, like every other token.
- **Gate it.** Extend `lib/rules.js` / `scripts/validate.js` to assert `mode` is present and
  one of `light`/`dark` for every theme, in the same hard-gate style (exit non-zero, name
  the failing theme). Document it alongside the other invariants.
- **`/themes` page** (entry stubbed in 021): render all theme cards (reuse `ThemeCard`).
  Top filter bar, all client-side on the already-loaded page (no router):
  - Fulltext search input — case-insensitive substring over name, tone, code font, prose
    font.
  - Select: mode (all / light / dark).
  - Select: tone (options from the distinct `tone` values in the JSON).
  - Filters combine with AND; show a live result count and an empty-state message.
- **Per-theme anchors.** Each card carries `id="<theme-id>"`; landing on `/themes#<id>`
  scrolls it into view and briefly highlights it. The homepage cards (021) link here.

**Implementation boundary.** `themes/aurora-themes.json` (add `mode` ×16); `lib/rules.js` +
`scripts/validate.js` (the `mode` gate); `app/src/*` (themes page + filter UI, `mode` added
to the `Theme` type in `themes.ts`, `id` anchor on `ThemeCard`). Docs: root `AGENTS.md`
(token/invariant section — document `mode` as a required, validated field) and `README.md`
(gallery + "adding a 15th theme" now lists `mode`). **Validation gate:** `python3 -m
json.tool themes/aurora-themes.json` then `node scripts/validate.js` must both pass.
**Excludes:** shell/home (021), tool copy (023).

## Acceptance criteria

- Every theme in `aurora-themes.json` has `mode`; `nocturne` + `borealis` are `dark`, the other 14 `light`.
- `node scripts/validate.js` fails when any theme is missing or has an invalid `mode`, and passes on the current set.
- `/themes` lists all themes and supports: fulltext search over name/tone/code font/prose font, a mode select, and a tone select; filters combine and show a result count + empty state.
- Each card has a stable `id`; visiting `/themes#<id>` scrolls to that theme.
- Homepage theme cards (021) deep-link correctly into these anchors.
- `AGENTS.md` and `README.md` document `mode` as a required, validated field.

## Notes

Reuse the existing `ThemeCard`; the gallery is a filter+layout shell around it, not a new
card. `mode` is a data change to the source of truth — expect a `build/` regeneration is not
required for the app (it reads JSON directly), but `npm run build` in `app/` should still
type-check the new field.
