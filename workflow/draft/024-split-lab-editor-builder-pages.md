# 024 — Split the Lab into separate Editor and Builder pages

priority: 6

## What & why

The `/lab` page stacks both theme-building tools (Theme Editor + Theme Builder)
on one long page — awkward to scan and to link to. Give each its own static page
at a clean URL so nav, deep-links, and cross-links can point at one tool. This
supersedes task 023's single-page stacked layout.

## Spec

Multi-page static site, no router/SPA (respect D1). Two new page entries, mirror
the existing `themes`/`lab` pattern (an `.html` + a `*.entry.tsx` + a rollup input
+ a dev/preview clean-URL rewrite):

- **`/editor`** (`editor.html` + `editor.entry.tsx`) renders `<SiteShell page="editor"><Playground/></SiteShell>`.
- **`/builder`** (`builder.html` + `builder.entry.tsx`) renders `<SiteShell page="builder"><Guided/></SiteShell>`.
- Each page keeps a short intro. `Playground`/`Guided` already own their `lab-tool-head`
  (h2 + description); a one-line page intro above is fine but not required. Do **not**
  change the tools' internals.
- **Nav** (`SiteShell.tsx`): replace the single `Lab` item with two items — default
  labels **`Lab: Editor`** (`/editor`) and **`Lab: Builder`** (`/builder`) — and extend the
  `Page` union. The `Lab:` prefix is the user's idea; drop it (plain `Editor`/`Builder`)
  if it reads cluttered in the rendered nav — that's an authorized judgment call, not a
  hard label.
- **`vite.config.ts`**: add `editor`/`builder` to `rollupOptions.input`; add
  `/editor`→`/editor.html` and `/builder`→`/builder.html` rewrites; remove the `/lab` one.
- **Remove `/lab`**: delete `lab.html` + `lab.entry.tsx` and its rollup input. The site
  is not deployed yet (hosting task 020 is still Ready), so no live `/lab` URL needs
  preserving — clean removal, no redirect file.

Implementation boundary:
- Production: `app/src/SiteShell.tsx`, `app/vite.config.ts`, new `app/editor.html`,
  `app/builder.html`, `app/src/editor.entry.tsx`, `app/src/builder.entry.tsx`; delete
  `app/lab.html`, `app/src/lab.entry.tsx`.
- Docs: `README.md` (explorer section — the `/lab` description and any two-tools-on-one-page
  wording) and root `AGENTS.md` (theme-change loop step mentioning `/lab`). Verify each and
  update only what names `/lab`; skip with a one-line reason if already generic.
- Exclusions: no change to `Playground.tsx`/`Guided.tsx` behavior; no router; no screenshot
  changes (`ShotView` renders at the site root, independent of these pages).
- Validation: `cd app && npm run build` (tsc + vite) is the gate; theme validators are
  untouched by app-only work.

## Acceptance criteria

- `/editor` loads as its own page showing only the Theme Editor; `/builder` loads as its own page showing only the Theme Builder.
- Site nav exposes both pages as distinct items (Editor and Builder), with `aria-current` on the active one.
- `/lab` is no longer a page (its stacked two-tool layout is gone); no dead nav link to it remains.
- `cd app && npm run build` succeeds and emits both `editor.html` and `builder.html` in `dist/`.
- `cd app && npm run screenshots` still runs unchanged (no shot-mode regression).
- README and AGENTS no longer describe the tools as living together on `/lab` (or a one-line note says the mention was already generic).

## Notes

Supersedes the 023 decision to keep both tools on one `/lab` page. Consider logging a
`D<N>` in `docs/decisions.md` if the single-vs-separate-page choice seems likely to be
revisited.
