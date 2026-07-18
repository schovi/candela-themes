# 023 — The Lab: rename & recopy Playground + Guided

priority: 8

depends: 021

## What & why

The two interactive tools have opaque names ("Playground", "Guided") and no explanation of
what they do or how to use them. On the new `/lab` page, give them clear names and short
intro copy (what it is, how it works) so a first-time visitor immediately gets them.

## Spec

- **`/lab` page** (entry stubbed in 021): host both tools inside the shared `SiteShell`, with
  a short landing blurb linking to each.
- **Rename + frame each** (final names are the implementer's call; these are proposals):
  - Playground — the live color editor with invariant checks → e.g. **"Theme Editor"**.
    Intro: one short paragraph — you edit any theme's tokens and see contrast/invariant
    pass-fail live, enforced by the *same* `lib/rules.js` rules `scripts/validate.js` gates
    on; how to read the pass/fail.
  - Guided — the build-a-theme wizard → e.g. **"Theme Builder"**. Intro: what you end up
    with and how the mood / hue / font steps work.
- **Behavior unchanged.** This is naming, copy, and placement only — no tool logic or
  invariant changes. Both tools keep full current functionality.

**Implementation boundary.** `app/src/Playground.tsx` + `app/src/Guided.tsx` (headings +
intro copy + any exported view labels), the `/lab` page/entry wiring, `app/src/App.tsx`
(remove the old view `<select>` if 021 left it), `styles.css`. Docs: `README.md` explorer/
playground section + any `AGENTS.md` mention of "Playground" updated to the new names.
**Excludes:** tool logic/invariant changes, gallery (022).

## Acceptance criteria

- `/lab` presents both tools under clear names (not "Playground" / "Guided"), each with a short what/how intro.
- Both tools keep full current functionality (editor live-checks against `lib/rules.js`; the wizard still builds a valid theme).
- `README.md` and `AGENTS.md` references are updated to the new names.
- `cd app && npm run build` passes.

## Notes

Keep the copy in the project's doc voice (`docs/style.md`). Pure UI/content task — not gated
by the theme validators, only by the app's `npm run build` type-check.
