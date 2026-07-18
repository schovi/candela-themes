# 027 — Homepage A/B/C name preview (Aurora / Fovea / Candela)

priority: 60

## What & why

We're weighing a rebrand away from "Aurora" (a light-theme project, but the name reads
dark-neon and the theme namespace is saturated). Two vision-science candidates lead:
**Fovea** (top pick, the eye's sharpest-vision spot) and **Candela** (runner-up, the SI
unit of luminous intensity). We want to *see* each name in context on the real homepage
before committing, with **Aurora kept as the control**.

Add a low-effort variant switch: one data file holds the three brandings, a `?name=` query
param selects which one the site renders. No hosted split-test, no analytics — just a URL
you open to eyeball each name in place. Default (no param) stays Aurora, so the experiment
is trivially removable later.

## Spec

- **Data module** — new `app/src/branding.ts`. Exports the three variants and a selector.
  Plain TS object (no YAML parser / no new dependency). Starting content (copy is editable,
  Wikipedia links per decision):

  ```ts
  export type Brand = { key: string; name: string; tagline: string; href: string };

  const BRANDS = {
    aurora:  { key: 'aurora',  name: 'Aurora',  tagline: 'Soft color, like light across a northern sky.', href: 'https://en.wikipedia.org/wiki/Aurora' },
    fovea:   { key: 'fovea',   name: 'Fovea',   tagline: "Tuned for the eye's sharpest vision.",          href: 'https://en.wikipedia.org/wiki/Fovea_centralis' },
    candela: { key: 'candela', name: 'Candela', tagline: 'Light, measured for tired eyes.',               href: 'https://en.wikipedia.org/wiki/Candela' },
  } as const;

  // Reads ?name=; unknown/absent -> aurora (the control). Client-side only.
  export function activeBrand(): Brand { /* new URLSearchParams(location.search).get('name') */ }
  ```

  `aurora` must reproduce the *current* wording where it already exists (wordmark, footer
  line) — it's the reference, not a redesign. `fovea`/`candela` are the same shape.

- **Whole-shell rebrand, param propagates** (per interview: "Everything!"). The active
  brand drives, everywhere:
  - `SiteShell.tsx` — header **wordmark** = `brand.name`; **footer** line = `${brand.name} — light themes for tired eyes.`
  - `SiteShell.tsx` **nav** links (Home / Themes / Lab) carry the active `?name=` so the
    chosen brand persists across pages. Aurora (the default) **omits** the param, keeping
    URLs clean. i.e. `href = base + (brand.key === 'aurora' ? '' : '?name=' + brand.key)`.
  - `Home.tsx` — hero product-name uses `brand.name` (`"{name} is a set of {N} color
    themes…"`), and add **one short striking tagline line** in the hero: `brand.tagline`
    rendered prominently, linking to `brand.href` (opens the explainer article). This is the
    "striking line" ask; place it right under the hero `what`/`why`.

- **Selection is self-contained.** `SiteShell` and `Home` each call `activeBrand()`
  directly — do not thread a prop through all three page entries. Keep the existing
  `?shot=1` handling in `home.entry.tsx` exactly as is; `?name=` and `?shot=1` are
  independent params.

- **Edge cases:** no param, empty param, or unrecognized value → Aurora. Matching may be
  case-insensitive (`?name=Fovea` ok); keep it a one-liner, don't over-build.

**Implementation boundary.** Owns `app/` only. New: `app/src/branding.ts`. Edits:
`app/src/SiteShell.tsx`, `app/src/Home.tsx`, and `app/src/styles.css` if the tagline line
needs a style. Reads `themes/aurora-themes.json` read-only (unchanged). **Excludes:** the
theme JSON and its validators (untouched — app edits aren't gated by them); gallery/lab
page internals; any hosted A/B analytics/cookie/persistence. **Load-bearing contract:** the
screenshot handshake (`?shot=1` → `data-shotReady`) — `ShotView` bypasses `SiteShell`, so
branding must **not** be wired into shot mode; keep that separation. Docs: verify whether
the README explorer section wants a one-line "`?name=` previews candidate names" note; skip
with a one-line reason if you judge the experiment too ephemeral to document.

## Acceptance criteria

- `cd app && npm run build` succeeds; no new runtime dependency was added to `app/package.json` (no YAML parser).
- A single data module defines exactly three variants — `aurora`, `fovea`, `candela` — each with a display name, a tagline, and an article URL.
- Loading `/` with no query param renders the current Aurora branding unchanged: wordmark, hero product-name, and footer line all read "Aurora".
- `/?name=fovea` and `/?name=candela` render that name in the header wordmark, the hero product-name, and the footer line; an unknown/empty `?name=` falls back to Aurora.
- The homepage shows one short striking tagline line for the active variant, linking to that variant's Wikipedia article.
- Header nav links carry the active `?name=` so the chosen brand persists to `/themes` and `/lab`; Aurora omits the param (clean URLs).
- Shot mode is intact: `/?theme=<id>&shot=1` still renders a chrome-free single card, and `npm run screenshots` still passes.

## Notes

- Deliberately a throwaway eyeball experiment, not a hosted split-test — Aurora is the
  default so removing it later is deleting `branding.ts` and reverting the name references.
- Name-research context (why Fovea/Candela, saturation + fit analysis) lives in the grooming
  conversation, not the repo. Not logging a `D<N>` — the rebrand decision isn't made yet;
  this task exists to inform it.
- Taglines and links are starting copy; edit them in `branding.ts` without touching JSX.
