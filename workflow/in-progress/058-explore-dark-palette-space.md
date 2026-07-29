# 058 — Explore the dark palette space and propose candidates

priority: 20

## What & why

The light half of the set has four deliberate experiments — near-monochrome
(`graphite-mono`), low-blue evening (`tungsten`), ultra-low chroma (`eink-slate`),
acuity-first (`contrast-max`) — and the dark half has none of them. Before authoring more
darks by taste, explore the space properly: build candidate palettes across those
categories, validate them, and come back with a ranked recommendation.

Output is a proposal, not shipped themes. Nothing lands in `themes[]` in this task — that's
the follow-up, decided from what this produces. Keeps the exploration cheap to throw away.

## Spec

Explore four dark categories, **2 or more candidates each**, all originals (no heritage
derivation — that's 057's job):

| Category | Dark reading of it | Light counterpart |
| --- | --- | --- |
| Evening / low-blue | warm amber-rose ground, blue accents suppressed | `tungsten` |
| Acuity-first | near-black ground, accents pushed well past AA toward AAA | `contrast-max` |
| Ultra-low chroma | near-grayscale syntax, OLED-friendly deep ground | `eink-slate` |
| Near-monochrome | one accent hue carrying all syntax meaning | `graphite-mono` |

For each candidate:
- Full token block in the shipped dark themes' shape (every token, `mode: "dark"`,
  `surface` lighter than `bg`, `punct` = `ink`).
- Passes every hard rule in `lib/rules.js`. Fastest loop: drop the candidate into a scratch
  copy of the themes JSON under the scratchpad and run `node scripts/validate.js` against it,
  or call `checkTheme` from `lib/rules.js` directly in a one-off node script. Either way the
  committed `themes/candela-themes.json` stays untouched.
- Rendered and eyeballed — paste it into the `/editor` Pro mode (or point the app at the
  scratch JSON) and look at the syntax and diagnostics panes. A palette that validates and
  looks muddy is a rejected candidate, and saying so is a result.

Deliverable: `docs/dark-palette-exploration.md`, following `docs/style.md`, containing:
- One section per category: what the category means in dark, what the constraint fight is
  (which rule pushed back hardest), and each candidate as a fenced JSON token block plus one
  or two lines on how it reads.
- Validation status per candidate: passes / passes-with-warnings (name the warning) / rejected
  and why.
- A ranked recommendation at the end: which candidates are worth shipping, in order, with
  a one-line reason each. It is a valid outcome to recommend fewer than eight, or to
  recommend a category be dropped because dark can't carry it — say so with the evidence.

**Boundary.** Owns the new `docs/dark-palette-exploration.md` and scratch files outside the
repo. Excludes `themes/candela-themes.json`, `lib/`, `app/`, `README.md`, screenshots, and
any release work. If a candidate can't pass a rule, that's a finding to write down, never a
reason to touch `lib/rules.js`.

## Acceptance criteria

- `docs/dark-palette-exploration.md` exists and covers all four categories with at least two candidates each, every candidate given as a complete token block.
- Every candidate carries an explicit validation verdict produced by actually running the rules (`scripts/validate.js` or `checkTheme`), not by eye.
- Every candidate carries a one-or-two-line note on how it actually rendered, so rejections are traceable.
- The doc ends with a ranked ship recommendation, each entry justified in one line, including any category recommended against.
- `git status` shows `themes/candela-themes.json`, `lib/`, `app/`, and `README.md` unchanged.

## Notes

Split from 057 (heritage-derived darks) on the user's ask: explore the space rather than
author two originals blind. No `depends:` — 058 touches no file 057 touches, so they can run
in either order or in parallel. The follow-up that ships winners into `themes[]` gets groomed
once this doc exists.
