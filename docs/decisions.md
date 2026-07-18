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
