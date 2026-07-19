# 037 — In-app dialogs, resume banner, and notices

priority: 50

## What & why

Three flows use native `window.confirm`: it shatters the crafted UI, the deep-link one
fires synchronously during first render (freezing any e2e automation — empirically
confirmed), and resumed drafts appear with zero context (EDITOR-REVIEW.md M3, M4, L1).
Replace with one small in-app pattern.

## Spec

- **One reusable overlay/dialog component** (native `<dialog>` or a positioned div; no
  dependency). Styled with the site's existing chrome; focus-trapped; Escape cancels.
- **Start over** routes through it ("Start over? This clears your saved draft and all
  current edits." → Cancel / Start over).
- **Deep-link replace** stops blocking render: on `/editor?theme=<id>` (or a share
  link) with a stored draft, render the editor with the stored draft immediately and
  show a non-blocking prompt: "Open <theme name>? This replaces your draft '<name>'."
  → Open / Keep my draft. No work is lost while deciding.
- **Resume banner (M4).** Loading `/editor` with a stored draft shows a dismissable
  one-liner: "Resuming your draft '<name>' — Start fresh?" (Start fresh routes through
  the Start-over dialog). Shown once per page load, not per session storage gymnastics.
- **Unknown `?theme=` id (L1).** Same banner slot: "Theme '<id>' not found." then the
  normal fallback (stored draft or start screen).
- If task 034 has not shipped when this is implemented, route the Pro→Simple confirm
  through the dialog too; if it has, that confirm no longer exists — verify and skip
  with a one-line note.

Boundary: `app/src/Playground.tsx`, one new small component file, `app/src/styles.css`.
Excluded: share-link payloads (039 reuses this flow), visual re-skin (040).

## Acceptance criteria

- `grep -rn "window.confirm\|window.alert" app/src` returns nothing.
- Deep-linking with an existing draft never blocks first render; both "Open" and
  "Keep my draft" behave as promised.
- Resume banner appears when (and only when) a stored draft is restored; dismiss and
  start-fresh both work.
- Unknown theme id shows the not-found notice and falls back gracefully.
- Dialog is keyboard-usable (focus moves in, Escape cancels, focus returns).
- `npm run build` (app) type-checks clean.
