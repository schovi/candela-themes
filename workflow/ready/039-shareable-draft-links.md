# 039 — Shareable draft links

priority: 70
depends: 037

## What & why

Today the only way to share work is exporting a JSON file; `?theme=` links only cover
official themes. Encoding the draft into a copyable URL makes themes social — open my
exact theme, riff on it, send it back. (EDITOR-REVIEW.md flagged the id-only deep link
as fragile; this is the beyond-fix.)

## Spec

- **Payload.** `location.hash` (`/editor#d=<base64url(JSON)>`) carrying `{draft, mode}`
  — a theme is ~1 KB, well within URL limits; the fragment never reaches server logs.
  Wizard `choices` are excluded (re-derivable; verify against 034's `deriveChoices` if
  shipped, else default choices — note which).
- **Copy link.** Button beside "Copy theme JSON" with the same "Copied!" feedback.
  Always enabled — sharing a work-in-progress (even export-blocked) draft is legitimate
  (decided).
- **Open flow.** On load with `#d=`: validate via the existing `validImportedTheme`
  gate. With a stored draft present, route through 037's non-blocking replace-or-keep
  prompt (never `window.confirm`, never blocking first render). Malformed/invalid
  payload → 037's notice banner ("This share link is damaged or not a Candela theme."),
  then normal fallback. Clear the hash after handling so reloads don't re-prompt.
- `?theme=<id>` links keep working unchanged (gallery Customize).

Boundary: `app/src/Playground.tsx`, `app/src/ExportControls.tsx` (button placement),
tiny encode/decode helper. Excluded: server-side shortening, social preview images.

## Acceptance criteria

- Edit a theme → Copy link → open the URL in a clean browser profile: identical draft
  (all tokens, name, fonts) and mode; no confirm dialogs on a fresh profile.
- Opening a share link with an existing draft offers replace-or-keep without losing
  the current draft or blocking render.
- A tampered `#d=` payload shows the damaged-link notice and never crashes or poisons
  localStorage.
- Reloading after opening a share link does not re-prompt (hash consumed).
- `npm run build` (app) type-checks clean.
