# Decisions

Append-only decision log. One entry per decision, stable `D<N>` handle. Newest at the bottom.
Written by `/workflow:decision`.

## D1 — Explorer is a static multi-page app, no SPA router (2026-07-18)

**Problem.** The explorer goes public on Cloudflare Pages (task 020) and needs real
pages (home, gallery, lab) with shareable URLs, replacing the single-page `<select>`
view switcher.

**Options.** (A) SPA with react-router and client-side routes. (B) Static multi-page
Vite build: one real HTML file per route (`index.html`, `themes.html`, `lab.html`),
cross-page nav via plain `<a href>`, interactivity staying client-side React within a
page.

**Choice.** B. Hosting stays a plain static serve — Cloudflare Pages maps `themes.html`
to `/themes`, so no SPA fallback or rewrite rule is needed, and fragment anchors
(`/themes#<id>`) handle in-page targets. No routing dependency in `app/package.json`.
A dev/preview Vite middleware rewrites `/themes` → `/themes.html` so local URLs match
production. Deliberate: do not add react-router or any router to "clean this up".

## D2 — Theme-building tools live on separate pages, not one Lab page (2026-07-18)

**Problem.** The two theme-building tools (Theme Editor + Theme Builder) were stacked on
one `/lab` page (task 023). That made the page long to scan and gave neither tool a clean
URL for nav and cross-links.

**Options.** (A) Keep both on one `/lab` page, linked by in-page anchors (the 023 layout).
(B) Split into two static pages — `/editor` (Theme Editor) and `/builder` (Theme Builder) —
mirroring the existing `themes`/`lab` page pattern (`.html` + `*.entry.tsx` + rollup input +
clean-URL rewrite), with two distinct nav items.

**Choice.** B (task 024), superseding the 023 single-page decision. Each tool now has its own
URL for nav and deep-linking; `/lab` is removed (the site was not yet deployed, so no live URL
needed preserving). Stays within D1 — still a static multi-page Vite build, no router. If the
two tools ever need to be seen side by side, this is the choice to revisit.
