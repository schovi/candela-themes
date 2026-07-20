# 043 — Editor inspect mode: click the preview to select a token

done: 2026-07-20
depends: 042

## What & why

Last of the flow trio (041 shell → 042 inspector→rail wiring → this): make the
preview canvas an input surface too. Click a tokenized element in a sample pane and
the rail opens that token's controls — closing the loop "I see the color I dislike,
take me straight to its knob" from the preview side, not just the inspector side.

Nearly all the plumbing already exists: every tokenized preview element carries
`data-token`, `jumpToToken()` (042) already reveals+focuses a token's rail control,
and `setHighlightedToken` + the `data-highlight` CSS already glow-highlight matching
tokens (rail→preview). 043 wires the reverse direction and adds the hover affordance.

## Spec

- **Click to inspect (always on).** A delegated handler on the editor's preview
  wrapper resolves `event.target.closest('[data-token]')` → token and calls the
  existing `jumpToToken(token)`. In Pro the token's disclosure opens (one-at-a-time,
  per 040) and focuses; in Simple the token/step is selected — same reveal 042 uses.
  Clicks on pane chrome, whitespace, or non-token text (no `data-token` ancestor) do
  nothing. Samples are non-editable `<pre>`, so hijacking text selection is a
  non-issue (user-decided: always on, no mode toggle, no modifier).
- **Hover affordance.** Pointer over a tokenized element calls
  `setHighlightedToken(token)` (glow via existing CSS) and `cursor: pointer` signals
  clickability; leaving clears it (`setHighlightedToken(null)`), restoring Simple's
  `selectedAccent` fallback. Reuses existing highlight plumbing end to end.
- **Keyboard = the rail (user-decided).** Click-in-preview is a mouse-first
  enhancement; every token stays fully reachable and controllable via the rail (042's
  accessible path). Do **not** make preview token spans tabbable — no ~100+ per-pane
  tab stops, no roving-tabindex.
- **Editor-only.** Wire this at the editor's `<ThemeCard>` call site (or an
  equivalent scoped wrapper) so the gallery's read-only cards stay non-interactive —
  no jump, no pointer cursor. Implementer's call whether to wrap at the call site or
  thread a prop; keep `ThemeCard`/`SamplePanes` reusable for the gallery either way.
- Ownership surfaces: `app/src/Playground.tsx` (delegated click/hover handler on the
  editor preview wrapper), `app/src/styles.css` (pointer cursor + any focus/hover
  affordance, scoped to the editor preview). Touch `app/src/ThemeCard.tsx` only if a
  wrapper/prop is cleaner than wrapping at the call site.
- Load-bearing contracts to preserve: the `data-token` attribute contract (shared by
  the highlight CSS and gallery swatches), `jumpToToken`'s one-at-a-time disclosure
  rule (040), and instant (not smooth) jumps honoring reduced motion (042).
- Excluded: keyboard traversal of previews; gallery-card interactivity; any new
  editing features, state-model changes, or panes; new npm dependencies.

## Acceptance criteria

- Clicking any tokenized element in any preview pane reveals+focuses that token's rail
  control, reusing `jumpToToken`, in both Pro and Simple modes.
- Hovering a tokenized element highlights the matching tokens (existing glow) and shows
  a pointer cursor; leaving clears the highlight.
- Clicks on pane chrome, whitespace, or non-token areas do nothing.
- Gallery theme cards stay non-interactive — no jump, no pointer cursor.
- No new tab stops in the previews; every token remains keyboard-reachable via the rail.
- Works in the collapsed ≤980px single-column layout.
- No regressions in validation / auto-fix / export; `npm run build` (app) type-checks
  clean; `npm run app` eyeball pass done.
