# 028 — Pre-render Home + Themes to static HTML (build-time SSG)

done: 2026-07-19

## What & why

The site (hosted by task 020) ships every page as an empty `<div id="root">` that only
fills in after JS runs — so crawlers, link-preview bots, and the first paint all see a blank
page, and the content is unreadable with JS off. Pre-render the two content pages (**Home**
and **Themes**) to full HTML at build time so the served file carries real content and React
hydrates it on load. Editor and Builder stay client-rendered (interactive tools; SSR buys
them little). No backend, no framework swap — stays a static Vite build on Cloudflare Pages.

## Spec

Minimal in-Vite SSG. After the normal client `vite build`, a prerender step renders the two
page trees to HTML strings and injects them into the built HTML shells; the client entries
**hydrate** the pre-rendered markup instead of creating a fresh root.

Decisions (from groom):

- **Scope: Home (`/`) and Themes (`/themes`) only.** Editor/Builder unchanged (client-only).
- **Keep React + hydration.** No Astro/Next, no RSC — a static host has no server runtime, so
  SSG is the real mechanism; RSC would be all migration cost, no payoff here.
- **Prefer a zero-new-dep custom prerender.** `vite` is already a devDep and `react-dom/server`
  ships with `react-dom`, so a custom prerender via Vite's SSR API needs **no new dependency**.
  `vite-react-ssg` is an acceptable fallback only if the custom path proves materially harder
  (its router-centric model fights this MPA + shot-mode setup); if you switch, log it as a
  decision and note which you used.

Mechanism:

- **Fold prerender into `npm run build`** so `build` = `tsc && vite build && <prerender>`. This
  keeps task 020's CF build command (`node ../scripts/validate.js && npm run build`) and the CI
  gate unchanged — the deployed artifact is automatically pre-rendered.
- Render each page tree to match its entry exactly: `<Home/>` (Home already includes its own
  `SiteShell`) for `index.html`; `<SiteShell page="themes"><Gallery/></SiteShell>` for
  `themes.html`. Inject the string into the built `dist/index.html` / `dist/themes.html` at
  `<div id="root"></div>` — touch only the div's contents, never the emitted hashed
  `<script>`/asset tags.
- **Entries** (`home.entry.tsx`, `themes.entry.tsx`): mount with `hydrateRoot` when `#root`
  already has server markup (`root.hasChildNodes()`), else `createRoot().render()`. This one
  guard keeps all three modes working: prod (prerendered → hydrate), dev server (empty root →
  create), and Home's `?shot=1` branch (dev only, empty root → create).

Hydration parity (verified at groom — keep it true):

- Home renders purely from static `brand` + `themes` data — deterministic.
- Gallery's initial state is deterministic (query `''`, mode `all`, empty tags,
  `DEFAULT_PANES`); `window`/`document`/`document.fonts` are touched only inside `useEffect`
  (client-only). Don't introduce init-time browser reads, or server/client markup diverges.
- Prerender the **default** view only (no `?shot=`, no `#hash`). Anchor-flash and all filters
  stay client-only enhancements.

Works-without-JS: with JS disabled, Home content and every theme card render; the
search/filter controls are visible but inert. That is the accepted degradation (Editor/Builder
need JS by nature and are out of scope).

### Implementation boundary

- Production surfaces: new prerender script (e.g. `app/scripts/prerender.mjs` or a Vite SSR
  build config), `app/package.json` `build` script, `app/src/home.entry.tsx` +
  `app/src/themes.entry.tsx` (createRoot → conditional hydrate; a tiny shared mount helper is
  fine to avoid duplicating the guard).
- Load-bearing: the `#root` shell + hashed-asset tags Vite emits must survive injection;
  `app/src/themes.ts` build-time JSON import must also resolve in the SSR/prerender context
  (`fs.allow: ['..']` already permits reading `../../themes/candela-themes.json`).
- Excluded: Editor/Builder pages (stay client-only), any runtime backend/SSR, screenshot
  pipeline changes (shot mode must keep working — but no new work), CF/hosting config (task 020
  owns it; unchanged because prerender rides inside `npm run build`), Playground/Guided/
  derive/autofix logic.
- Docs: README explorer/hosting section — note the built site is pre-rendered (Home + Themes)
  and hydrates; `docs/decisions.md` `D2` only if a substantive approach choice is made
  (custom prerender vs `vite-react-ssg`), else skip.

## Acceptance criteria

- `cd app && npm run build` produces `dist/index.html` and `dist/themes.html` whose `<div id="root">` contains real rendered content (theme names/cards present in the raw HTML, `grep`-able), not an empty div.
- The built `/` and `/themes`, served from a static file server with **JavaScript disabled**, show content (Home text + all theme cards; filters visible though inert).
- With JS enabled, both pages hydrate with **no React hydration warning** in the console, and all interactivity works (search, mode/tag filters, pane toggles, `/themes#<id>` anchor-flash, nav).
- `/editor` and `/builder` are unchanged and still client-render correctly; their built `#root` stays an empty shell (no attempt to SSR the tools).
- Screenshot flow still works: `npm run screenshots` (dev server, `?shot=1`) renders chrome-free cards as before.
- Task 020's CF build command and CI need no change — prerender runs inside `npm run build`. (Verify 020's wording still describes the deployed artifact; update only if it drifts.)
- No new runtime dependency added (custom prerender via Vite SSR + `react-dom/server`); if `vite-react-ssg` is used instead, it's logged as a decision with the reason.

## Notes

Decided at groom: minimal in-Vite SSG (no Astro/Next/RSC), pre-render Home + Themes only, keep
React hydration, fold prerender into `npm run build`, prefer the zero-new-dep custom prerender.
`/work` picks the concrete mechanism (custom Vite-SSR script preferred over `vite-react-ssg`)
and logs a decision if it deviates. No `depends:` — orthogonal to 020 (hosting), since prerender
rides inside `npm run build`; nice to land before the site is public, not required.
