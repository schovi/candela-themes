# 044 — Homepage simplify: coherent hero, product sooner

priority: 20

## What & why

The homepage hero stacks six differently-styled text blocks (mono eyebrow, serif
title, mono gloss, 18px "what", 15.5px "why", mono invariants footnote) — three
registers alternating line by line. It reads as hard-to-scan AI-slop and pushes the
actual product (the 16-theme grid) two screens down, behind two more prose sections.
Rework the homepage so the first screen sells with the demo, the copy is one voice,
and the theme grid arrives within roughly one scroll.

## Spec

Decisions made at groom (all confirmed with the user):

- **Scope: whole homepage** — `Home.tsx` + its styles. Site shell (nav/footer),
  gallery, and editor pages untouched. No site-identity re-skin (cream + serif
  stays; that is a separate, deliberate decision if ever).
- **Fold goal: demo + themes fast.** Hero left column shrinks to: headline, one
  short subhead (one or two sentences, benefit-led), CTAs. Live `HeroDemo` stays as
  the right column. The "All N themes" grid must be reachable within ~one scroll on
  a typical laptop viewport.
- **Copy: condense to one section.** Merge the hero "why" paragraph and the "Why
  most light themes hurt" bullets into a single tight section, rewritten per
  copywriting principles: specific over vague, no repetition between hero and
  section, benefit-led bullets, link to vision-research for depth. Fold the "How it
  works" prose into it or into a short line near the grid/footer — its three
  paragraphs (formats list, gallery/editor links, README link) must survive as
  links, not as a standalone prose section. Keep the tagline in `branding.ts`
  unless a strictly better line emerges; the "candela — SI unit" gloss may move
  (e.g. footnote near the grid) or go — it must not sit as a third register inside
  the hero stack.
- **Type system: strict roles.** Display face for the H1 only; exactly one body
  style (size/color) for all homepage prose; mono reserved for actual code/data
  (swatch captions, the contrast-invariants line if kept, sample code). Kill the
  per-paragraph register alternation. Section headings get one consistent
  treatment. Encode this as a small set of homepage type classes in `styles.css`
  rather than per-block one-offs.
- The contrast-invariants line ("ink : paper ≥ 7:1 …") is a real differentiator —
  keep the fact, but placed and styled so it reads as data (mono is fine there),
  not as another competing paragraph.

Implementation boundary:

- Production surfaces: `app/src/Home.tsx`, homepage sections of
  `app/src/styles.css` (`.hero*`, `.why`, `.how`, `.theme-index` rules).
  `app/src/branding.ts` only if the tagline changes.
- Explicit exclusions: `SiteShell.tsx`, `Gallery.tsx`, `Playground.tsx`, editor
  pages, `docs/screenshots/` (per-theme gallery shots, homepage not covered),
  theme JSON and validators (not in play — this is app-only, gated by the app
  build, not `scripts/validate.js`).
- Routed docs: root `AGENTS.md` + root `README.md` (explorer sections) — verify
  whether either describes the homepage structure; update only if the description
  no longer matches, otherwise skip with a one-line reason.
- Validation: `cd app && npm run build` (type-check + prerender). Eyeball the
  rendered page (`npm run dev` or `npm run app`) at desktop and ≤960px widths —
  the hero already collapses to one column there; the new structure must too.

## Acceptance criteria

- Hero left column contains exactly three text elements: headline, one short
  subhead, CTA row (plus at most one clearly-data mono line, e.g. invariants).
- Homepage prose uses one body style; mono appears only on code/data, and the
  display face only on the H1. No two adjacent text blocks switch typeface AND
  size AND color at once.
- The rationale content (eye-strain "why" + hard-rules bullets) exists exactly
  once on the page, as one section, with the vision-research link intact.
- Gallery, Theme Editor, README/install, and GitHub links all still present
  somewhere on the page.
- Theme grid starts within ~one scroll of the fold on a 1440×900 viewport.
- `cd app && npm run build` passes; layout verified by eye at desktop and mobile
  widths.

## Notes

- Groom used `/frontend-design` + `/copywriting` guidance; final copywriting and
  exact type scale are `/work`'s call within the constraints above.
- The frontend-design skill flags cream + serif-display as the most common
  AI-default look. User explicitly scoped the re-skin question out; if the result
  still feels templated after this pass, that's a follow-up task, not scope creep
  here.
