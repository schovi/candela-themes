# 020 — Host the theme explorer on Cloudflare Pages

priority: 5

## What & why

The `app/` explorer is a self-contained Vite + React SPA that imports the
source-of-truth JSON at build time (`app/src/themes.ts`), so `vite build`
produces fully static assets — no backend. Ship it to a public URL so the
themes are browsable without cloning the repo. Host: Cloudflare Pages
(reuses the existing Cloudflare zone for schovi.cz), git-integration
deploys on push to `main`, served at **aurora.schovi.cz**. Clipboard export
already exists (`Playground.tsx`, `Guided.tsx`) — no export work here.

## Spec

Cloudflare Pages **git integration** does the build and deploy; those steps
are done by the owner in the Cloudflare dashboard, not by code. The repo
deliverable is: make the build reproducible on CF's builders and document the
exact settings + one-time runbook.

Repo-side work:

- **Pin the Node version** so CF's builder matches local (Vite 6 needs Node
  18+). Add a `.node-version` file (Node 20) at the CF build root. CF reads it
  from the configured *root directory* — so `app/.node-version`. Verify CF's
  lookup path; if it only honors repo-root, put it there instead, or fall back
  to a `NODE_VERSION` dashboard env var and document that. One approach, not
  all three.
- **Verify `base`** is correct for subdomain-root hosting. Assets serve from
  `/` at aurora.schovi.cz, which is Vite's default `base: '/'`. Confirm no
  change is needed; only touch `app/vite.config.ts` if the built `dist/`
  references break at the domain root.
- **No SPA fallback needed** — single page, state-based tabs, no router, no
  deep links. Do not add `_redirects`/`_headers` unless the built site
  actually 404s; note the reason if skipped.
- **Document hosting** in `README.md` (extend the explorer/"How themes are
  generated" area, ~L145/L280): the explorer is live at aurora.schovi.cz on
  Cloudflare Pages, plus the exact Pages settings — **production branch**
  `main`, **root directory** `app`, **build command** `npm run build`,
  **build output directory** `dist` (relative to root dir), and the one-time
  dashboard runbook (connect GitHub repo `schovi/aurora-themes`, set the above,
  add custom domain `aurora.schovi.cz` → CF creates the CNAME in the schovi.cz
  zone automatically).
- **Log the host decision** as `D1` in `docs/decisions.md` (Cloudflare Pages +
  git integration + aurora.schovi.cz, and why: existing CF zone, static site,
  zero new vendors). Optional but the contract routes decisions there.

Owner runbook (handed off, not code): in Cloudflare dashboard → Pages →
connect `schovi/aurora-themes` → apply the build settings above → add custom
domain `aurora.schovi.cz`.

### Implementation boundary

- Production surfaces: `app/.node-version` (new), possibly `app/vite.config.ts`
  (only if base breaks).
- Docs: `README.md` (explorer/hosting), `docs/decisions.md` (`D1`).
- Load-bearing: `app/src/themes.ts` build-time JSON import must survive the CF
  build (root dir `app`, reads `../../themes/aurora-themes.json`; Vite
  `fs.allow: ['..']` already permits it, full repo is checked out).
- Excluded: the dashboard/DNS steps (owner does these), any export/clipboard
  changes, any backend, CI workflow files (git integration replaces them).

## Acceptance criteria

- `cd app && npm install && npm run build` succeeds and `app/dist/` opens as a
  working static site with no dev server and no backend (open `dist/index.html`
  via a static file server; themes render, clipboard export works).
- Node version is pinned so the Cloudflare build is reproducible (committed
  `.node-version`, or a documented `NODE_VERSION` fallback if CF's lookup
  requires it).
- `base`/asset paths verified correct for hosting at the aurora.schovi.cz root
  (default `/` confirmed, or adjusted with a one-line reason).
- `README.md` documents the live URL (aurora.schovi.cz), that it's on
  Cloudflare Pages via git integration, the exact Pages build settings, and the
  one-time connect + custom-domain runbook.
- Host decision recorded in `docs/decisions.md` as `D1`.

## Notes

Deploy trigger, host, and hostname were decided at groom (Cloudflare Pages /
git integration / aurora.schovi.cz). The dashboard connect + custom-domain
steps are the owner's to run; this task makes the repo build cleanly on CF and
documents the settings so the setup is reproducible.
