# 020 — Host & auto-publish the theme explorer on Cloudflare Pages

priority: 5

## What & why

The `app/` explorer is a self-contained Vite + React static site that imports the
source-of-truth JSON at build time (`app/src/themes.ts`), so `vite build` produces fully
static assets — no backend. Publish it to a public URL (**aurora.schovi.cz**) so the themes
are browsable without cloning, and **gate every publish on the theme + app checks** so a
broken source-of-truth or a broken build never ships. Host: Cloudflare Pages (reuses the
existing Cloudflare zone for schovi.cz), git-integration deploys on push to `main`.
Clipboard export already exists (`Playground.tsx`, `Guided.tsx`) — no export work here.

## Spec

Two pieces: a **validation-gated publish** (nothing ships unless themes + app build are
green) and the **Cloudflare Pages setup**, which the agent provisions directly over the
authorized **Cloudflare MCP** — no manual dashboard hand-off required.

### Publish flow

- **Cloudflare Pages git integration stays the deployer.** Push to `main` → CF builds from
  the repo → deploys to aurora.schovi.cz. Keep it — simplest publish path, and it gives PR
  preview URLs for free.
- **Gate the CF build on validation.** Set the Pages **build command** so validation runs
  before the build and a failure aborts the deploy: `node ../scripts/validate.js && npm run
  build` (runs from root dir `app`; full repo is checked out and `validate.js` resolves its
  paths via `__dirname`, so `../scripts` works). If `validate.js` exits non-zero (malformed
  JSON or a broken invariant), CF fails the build and publishes nothing.
- **GitHub Actions CI for pre-merge checks.** Add `.github/workflows/ci.yml` on
  `pull_request` and `push` to `main`: Node 20, then the same gate — `python3 -m json.tool
  themes/aurora-themes.json`, `node scripts/validate.js`, `cd app && npm ci && npm run
  build`. This makes theme/app validity a PR status check (bad changes caught before merge),
  mirroring the CF build gate. Keep the commands identical to the CF build command — one
  gate expressed twice, not two that drift.
- Screenshots (`npm run screenshots`, Playwright) stay **out** of the pipeline — heavy,
  regenerates committed PNGs; run locally when the gallery changes. Note the exclusion.

### Cloudflare setup (agent-driven via Cloudflare MCP)

- **Provision/configure the Pages project over the Cloudflare MCP**: connect GitHub repo
  `schovi/aurora-themes`, production branch `main`, **root directory** `app`, **build
  command** `node ../scripts/validate.js && npm run build`, **build output directory** `dist`
  (relative to root dir), add custom domain `aurora.schovi.cz` (CF creates the CNAME in the
  schovi.cz zone). If a step can't be done over MCP, document it as a one-time dashboard
  fallback.
- **Pin the Node version** so CF's builder matches CI/local (Vite needs Node 18+). Add
  `app/.node-version` (Node 20) at the CF root dir; verify CF honors it there, else fall back
  to a `NODE_VERSION` env var and document which.
- **Verify `base`.** Assets serve from `/` at the subdomain root — Vite's default `base:
  '/'`. Confirm no change; only touch `app/vite.config.ts` if built `dist/` paths break at
  the domain root.
- **No SPA fallback / `_redirects` needed.** The site is static multi-page (real `index.html`
  / `themes.html` / `lab.html` after task 021; a single page today) — every route is a real
  file, so CF serves them directly with clean URLs. Add `_redirects`/`_headers` only if the
  built site actually 404s; note the reason if skipped.

### Surface the live URL

- Once live, add the URL to `README.md` (intro/top) and set the GitHub repo **About →
  Website** field to `https://aurora.schovi.cz` (`gh repo edit schovi/aurora-themes
  --homepage https://aurora.schovi.cz`, or a documented manual step if `gh` isn't available).
- **Log the host decision** as `D1` in `docs/decisions.md`: Cloudflare Pages + git
  integration + validation-gated build + aurora.schovi.cz, and why (existing CF zone, static
  site, zero new vendors, gate keeps broken themes off prod).

### Implementation boundary

- Production surfaces: `.github/workflows/ci.yml` (new), `app/.node-version` (new), possibly
  `app/vite.config.ts` (only if base breaks). The Pages project config is applied via the
  Cloudflare MCP (not a repo file); the GitHub About/website via `gh` (repo setting, not a
  file).
- Docs: `README.md` (explorer/hosting + publish pipeline + live URL), `docs/decisions.md`
  (`D1`).
- Load-bearing: `app/src/themes.ts` build-time JSON import must survive the CF + CI build
  (root dir `app`, reads `../../themes/aurora-themes.json`; Vite `fs.allow: ['..']` already
  permits it, full repo checked out). Build settings (root `app`, build `npm run build`,
  output `dist`) are intentionally architecture-agnostic so they survive the 021 multi-page
  redesign.
- Excluded: screenshot regeneration in CI, any export/clipboard changes, any backend,
  `wrangler pages deploy` / an Actions-owned deploy (CF git-integration handles deploy).

## Acceptance criteria

- `cd app && npm install && npm run build` succeeds and `app/dist/` opens as a working static site with no dev server and no backend (open via a static file server; themes render, clipboard export works).
- The Cloudflare Pages build command runs `node ../scripts/validate.js` before the app build, so an invariant failure or malformed source JSON aborts the deploy (nothing publishes).
- `.github/workflows/ci.yml` runs on PRs and on `main` and fails when `scripts/validate.js` fails or `cd app && npm run build` fails; it runs the same gate the CF build does.
- Node version is pinned for a reproducible CF build (committed `.node-version`, or documented `NODE_VERSION` fallback).
- `base`/asset paths verified correct for hosting at the aurora.schovi.cz root (default `/` confirmed, or adjusted with a one-line reason).
- The Cloudflare Pages project is provisioned via the Cloudflare MCP (repo connected, production branch `main`, root dir `app`, the gated build command, output `dist`, custom domain aurora.schovi.cz) — or the exact remaining manual step is documented where MCP can't cover it.
- The live URL is surfaced: `README.md` links it and the GitHub repo About/website field is set to `https://aurora.schovi.cz`.
- `README.md` documents that publishing is Cloudflare Pages via git-integration gated by validation, the GitHub Actions CI, the exact Pages settings, and how PR previews work.
- Host decision recorded in `docs/decisions.md` as `D1`.

## Notes

Deploy trigger, host, hostname, and the validation-gated publish were decided at groom
(Cloudflare Pages / git-integration gated on `validate.js` + app build / aurora.schovi.cz).
The Pages project is set up by the agent over the authorized Cloudflare MCP, with a
documented dashboard fallback. CI (GitHub Actions) and the CF build command run the *same*
gate so a broken theme or build can't publish. This task doesn't depend on the 021 redesign —
the build settings are architecture-agnostic — but publishing after 021 lands means the
public site is the redesigned multi-page one.
