# 021 — Explorer as a public site: multi-page shell + homepage

done: 2026-07-18

## What & why

The explorer is about to go public on Cloudflare Pages (task 020) but presents as an
internal tool: a thin eyebrow + `<h1>` header, a `<select>` switching four views held in
React state, no shareable URLs, and a stale "14 light themes" tagline (there are 16 now,
two of them dark). Rebuild it as a **static multi-page site** with a real shell and a
homepage that pitches Aurora (what / why / how + install) and indexes every theme with a
tiny preview. This is the foundation the gallery (022) and the tools page (023) build on.

## Spec

- **Multi-page Vite build, no SPA, no router.** Add entry HTML files: `index.html`
  (home), `themes.html` (gallery — filled in 022), `lab.html` (tools — filled in 023).
  Configure `build.rollupOptions.input` for all three. Cross-page nav is plain `<a href>`;
  interactivity stays client-side React within a page. Each route is a real static file —
  Cloudflare Pages serves `themes.html` at `/themes`, so no SPA fallback / rewrite is
  needed. Do **not** add react-router or any routing dependency (decision below).
- **Shared `SiteShell`** component: header with the Aurora wordmark + nav (Home / Themes /
  Lab) + footer; current page marked active. Replaces the current `app-header` + view
  `<select>`. Each page mounts its own React root and wraps content in `SiteShell`.
- **Homepage** (`index.html`):
  - Hero — what Aurora is + the eye-strain rationale (why), one tight line each. Pull the
    rationale from `README.md` / `docs/vision-research.md`; do not invent claims. Count is
    accurate (16 themes, 14 light + 2 dark).
  - How / install — one short block: "authored in one JSON source of truth, generated into
    terminal + editor formats", with a pointer to the README install section / repo.
  - Theme index — every theme as a compact card: name + tone chip + **tiny preview**
    (palette swatch row + one line of sample code rendered in that theme's colors and code
    font). Each card links to its gallery anchor `/themes#<id>`.
  - Basic SEO/social meta on home: `<title>`, meta description, favicon (it's public now).
- **Preserve screenshot mode.** `scripts/screenshots.mjs` drives `?theme=<id>&shot=1` for
  chrome-free single-card capture and waits on `data-shotReady`. Keep an equivalent working
  (same entry or a dedicated one) so `npm run screenshots` still passes. Verify by running it.
- **Don't delete the tools.** Playground/Guided get renamed and moved to `/lab` in 023;
  until then keep them reachable (a plain `lab.html` mounting them as-is is fine).

**Implementation boundary.** Owns `app/` only: `app/index.html`, new `app/themes.html` +
`app/lab.html` (stub entries so the 3-page build passes), `app/vite.config.ts`,
`app/src/*` (new `SiteShell`, home page + per-page entry mains, `styles.css`). Likely
touches `scripts/screenshots.mjs` if the shot entry/URL moves. Docs: `README.md` explorer
section + root `AGENTS.md` local notes (run/build commands if entries change). Reads
`themes/aurora-themes.json` read-only. **Excludes:** gallery filter/anchor logic and the
source `mode` field (022); tool rename/copy (023). **Load-bearing contract:** the shot-mode
handshake with `scripts/screenshots.mjs` (`?shot=1` → `data-shotReady`).

## Acceptance criteria

- `cd app && npm run build` succeeds and emits separate home / themes / lab HTML outputs (multi-page); no routing dependency was added to `package.json`.
- Home (`/`) shows a hero (what + why), a how/install block with a repo/README pointer, and every one of the 16 themes as a card with name, tone, and an in-theme tiny preview; each card links to `/themes#<id>`.
- A shared shell (wordmark + Home/Themes/Lab nav + footer) renders on every page and marks the current page.
- No "14 light themes" (or any hardcoded count) remains; the count reflects the actual themes in the JSON.
- Home has a `<title>`, a meta description, and a favicon.
- `npm run screenshots` still captures chrome-free single-theme cards (shot mode intact).
- Playground and Guided are still reachable (not deleted), pending 023.

## Notes

- Routing decision (candidate `D<N>` — worth logging via `/workflow:decision`): **static
  multi-page app, no SPA, no react-router**. Per-page real HTML files + fragment anchors,
  chosen over an SPA so hosting stays a plain static serve. A future agent might try to add
  a router — this is deliberate.
- Coordinate with **020 (Cloudflare Pages)**: it should host this multi-page output — clean
  URLs (`/themes`, `/lab`), no SPA rewrite rule. Not a hard `depends`, but flag at hosting.
