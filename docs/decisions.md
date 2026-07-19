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

## D3 — Host the explorer on Cloudflare Pages, git-integration, validation-gated (2026-07-19)

**Problem.** The explorer should be browsable at a public URL without cloning, and a
broken source-of-truth JSON or a broken app build must never publish.

**Options.** (A) Cloudflare Pages with git integration: push to `main` builds and
deploys, PR previews for free. (B) GitHub Actions building and deploying via
`wrangler pages deploy` (or GitHub Pages). (C) Any new static host (Netlify, Vercel).

**Choice.** A, at **candela.schovi.cz** (task 020). The schovi.cz zone already lives on
Cloudflare (zero new vendors), the site is fully static, and git integration is the
simplest publish path with PR preview URLs included. The Pages build command runs
`node ../scripts/validate.js && npm run build` so a failed invariant aborts the deploy;
GitHub Actions CI runs the identical gate pre-merge. Deploys stay owned by Cloudflare —
no Actions-owned deploy step to maintain or authenticate.

## D4 — Canonical domain is candela.ink; candela.schovi.cz redirects (2026-07-19)

**Problem.** D3 shipped the explorer on candela.schovi.cz, a personal subdomain. The
project deserves its own name, and two live URLs would split links and search results.

**Options.** (A) Keep candela.schovi.cz as canonical. (B) Buy a project domain, make it
canonical, 301-redirect the old subdomain. (C) Serve both with no redirect.

**Choice.** B: **candela.ink** (bought on Cloudflare Registrar — `ink` is literally the
set's primary text token). Attached to the same Pages project (proxied apex CNAME);
candela.schovi.cz stays attached and 301-redirects with path preserved via
`app/public/_redirects` (a zone redirect rule was blocked by API token permissions; the
`_redirects` file is repo-versioned, which is better anyway). All docs and the GitHub
homepage point at candela.ink only.
