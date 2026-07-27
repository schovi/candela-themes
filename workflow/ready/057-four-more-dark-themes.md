# 057 — Four more dark themes, derived from the popular classics

priority: 10

## What & why

The set ships 16 themes but only 2 are dark (`nocturne`, `borealis`), so anyone who works
dark has two choices out of sixteen. Add four dark themes whose palettes are *derived from*
the dark themes developers already know, the way `nocturne` is derived from One Dark, and
bring the set to 20 (14 light / 6 dark).

None of the four is a faithful copy and the spec must not pretend otherwise: our hard rules
(every syntax token AA against `bg`, `ink` AAA on `surface`, unique diagnostic hexes,
desaturated accents) move hues and lightness away from the originals. The goal is
recognizable heritage that passes `scripts/validate.js`, not a clone.

## Spec

**1. Confirm the source ranking.** Research current popularity of dark editor themes
(VS Code Marketplace install counts are the usable signal; JetBrains/Vim ecosystems as a
sanity check). Record the ranking with numbers in the task Notes when done.

Default picks, chosen to be popular *and* hue-distinct from the two shipped darks — keep them
unless the ranking clearly contradicts one, and say in Notes which you swapped and why:

| Heritage | Hue territory it adds |
| --- | --- |
| Dracula | purple/magenta on near-black |
| Tokyo Night | deep indigo-blue, low chroma |
| Gruvbox Dark | warm retro brown/amber |
| Monokai | vivid green/pink on gray-black |

Excluded on purpose: One Dark (already `nocturne`), Catppuccin Mocha and Nord (both collapse
into `borealis`/`nocturne` territory once desaturated).

**2. Author the palettes** as four new entries at the end of `themes[]` in
`themes/candela-themes.json`, ids 17–20, following the shipped dark entries' shape exactly:
`id`, `name` (`"17 · <Name>"`), `tone` (`"dark / <flavor>"`), `tags` (non-empty, include
`"dark"`), `mode: "dark"`, `description` naming the heritage in one clause, `fonts`
(`code` + `prose`, reuse fonts already in the JSON — no new font dependencies), and the full
`colors` block with every token present. Names are Candela's own, in the register of the
existing set (evocative, one or two words) — not the source theme's name.

Keep the shipped darks' structural relationships: `surface` slightly lighter than `bg`,
`punct` = `ink`, `ok` may equal `str`, `cursor` a warm attention color.

**3. Validate and eyeball.**
- `python3 -m json.tool themes/candela-themes.json > /dev/null`
- `node scripts/validate.js` — must exit 0 with no new warnings beyond what `main` already
  emits (capture the before/after if a warning appears)
- `npm run build`
- `cd app && npm ci && npm run build` (`app/src/derive.test.ts` iterates dark builtins, so
  new dark themes enter that test's input set)
- `npm run app`, open `/themes`, check each new card's syntax panes and diagnostics pane
  for hue collisions and muddy `faint`/`border`

**4. Publish surfaces.**
- `README.md`: four rows in the theme table (lines ~60–77), four gallery rows (~107), and
  extend the dark-companions bullet list (~85–92) — it currently reads "The two dark
  companions"; rewrite the heading line for six.
- `AGENTS.md:3`: the "16 color themes (14 light and 2 dark)" count.
- `npm run app:screenshots` to write `docs/screenshots/examples/candela-{17..20}-<id>.png`
  (Playwright; `docs/screenshots/README.md` has the first-run install steps). PNGs are
  committed.
- Verify whether any other doc carries a theme count that drifts (`docs/marketplace-listing.md`
  deliberately forbids counts — leave it); skip with a one-line reason if nothing else needs it.

**Boundary.** Owns `themes/candela-themes.json`, `README.md`, `AGENTS.md`,
`docs/screenshots/examples/`. Excludes any change to `lib/rules.js`, `lib/emitters.js`,
`app/src/`, or the existing 16 palettes — if a new theme can't pass the rules, retune the
theme, never the rule. No release dispatch; that's a separate `/release` decision.

## Acceptance criteria

- `themes/candela-themes.json` holds 20 themes, 6 with `mode: "dark"`, and the four new entries define every token in the reference with no field missing relative to the shipped dark entries.
- `node scripts/validate.js` exits 0; `npm run build` and the `app/` build both pass.
- Each new theme's palette is visibly in its source's hue territory (purple / indigo / warm amber / vivid green-pink) and none of the four reads as a near-duplicate of `nocturne` or `borealis`.
- Each new theme's `description` credits its heritage in words, and none of the four uses a source theme's name as its own name.
- README's theme table, dark-companions prose, and gallery grid all list 20 themes with working image paths; `AGENTS.md` states 20 themes (14 light / 6 dark).
- `docs/screenshots/examples/` contains a committed PNG for each new theme, named `candela-<NN>-<id>.png`.
- Notes records the popularity ranking with numbers, plus any swap from the default four and why.

## Notes

Precedent for the heritage-credit pattern: `nocturne` ("derived from Atom's classic One
Dark"), task 049. Decided in groom: 4 themes, popularity-ranked but hue-diverse, Candela
names with heritage credit in the description, full doc + screenshot pipeline in this task.
