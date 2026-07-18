# 026 — Homepage story cross-links to Themes, Editor, and Builder

priority: 8
depends: 024

## What & why

The homepage's prose (hero + "How it works") tells the Aurora story but never links
into the rest of the site — a reader can't jump from the narrative to the gallery or
the build tools. Weave in cross-links so the story points at the pages it describes.

## Spec

- In the Home page body prose, add inline links where the narrative naturally names them:
  - **themes** → `/themes` (the gallery),
  - **Theme Editor** → `/editor`,
  - **Theme Builder** → `/builder`.
- Prefer weaving links into existing sentences over bolting on a new paragraph; a short
  added sentence in the "How it works" section is fine if it reads better (e.g. "Browse
  all N in the [gallery], tweak one in the [Theme Editor], or derive your own in the
  [Theme Builder].").
- Keep it prose, not a nav/button row — the header nav already covers navigation; this is
  the story linking to what it mentions.

Implementation boundary:
- Production: `app/src/Home.tsx` only.
- Docs: none expected (homepage copy is the deliverable); skip doc sync with that reason.
- Exclusions: no change to the theme-index cards (they already link `/themes#<id>`); no
  layout/design changes beyond adding links.
- Validation: `cd app && npm run build`; eyeball `/` that the links render and resolve.

## Acceptance criteria

- The Home body prose contains inline links to `/themes`, `/editor`, and `/builder` with meaningful anchor text.
- Each link resolves to the real page (matches the routes 024 establishes).
- `cd app && npm run build` succeeds.

## Notes

Depends on 024 for the `/editor` and `/builder` URLs.
