# 065 — Harbor: a warm-cream / deep-blue theme pair

done: 2026-07-31

tags: palettes

## What & why

Slack's "Surprise me" generated a combination worth keeping: deep blue chrome against a
warm peach-cream ground, with dusty pink and warm tan as the secondary notes. Nothing in
the 24 shipped themes pairs a **warm ground with a blue-led palette** — the warm lights
(`sepia-paper`, `solarized-lite`, `apricot`, `tungsten`) are all orange- or brown-led, and
the one deep-blue keyword (`ink-coral`) sits on a cool gray. It is also exactly the
blue + orange pairing `AGENTS.md` names as the colorblind-safe default.

Ship it as a light theme and a dark counterpart: **25 · Harbor** and **26 · Harbor Night**.

## Spec

**Seed, not palette.** The source hexes are chrome colors from Slack and most of them fail
Candela's floors on a light ground — do not paste them in:

| Slack slot | Hex | On a `#fff0eb` ground |
| --- | --- | --- |
| System navigation | `#1264a3` | ~5.6:1, clears AA — usable as the lead blue |
| Selected items | `#fff0eb` | the ground itself |
| Presence indication | `#e296b9` | ~1.9:1, far under AA — darken hard or drop |
| Notifications | `#e8a991` | under AA — darken |

**1. Author `harbor` (light).** Warm cream `bg` in the `#fdf1ea`–`#fff0eb` family,
`surface` slightly lighter, deep blue as `kw`, warm tan/orange and a darkened dusty rose as
the counter-hues. Blue is the lead hue here, which puts pressure on two invariants worth
watching while tuning:

- `builtin` is normally the cyan/accent role — keep it clearly tellable from a blue `kw`,
  or move `builtin` off blue entirely.
- `error` leans vermillion and the palette already carries a warm tan; keep `error` unique
  against `num` and against the tan, and keep `error`/`ok` luminance-separated so the pair
  survives grayscale.
- Purple tokens (if any) must sit at a different lightness than the blues — the protan/deutan
  rule bites harder than usual on a blue-led palette.

**2. Explore `harbor-night` (dark), don't author it by taste.** Follow the D12 / task 058
method: author 2–3 ground candidates (a true navy around `#14263c`, a deep blue-gray, and a
neutral dark carrying blue + peach accents), run each through `node scripts/validate.js`,
render each in the explorer, and **show them to the user to pick** before shipping one. The
three shipped darks nearest this territory are the bar to clear: `nocturne` (`#282c34`,
desaturated blue-gray), `blue-hour` (`#1a1b26`, near-black indigo), `azure-mono`
(`#181a1c`, neutral with a single azure). The candidate that ships must not read as a
fourth version of those. Record the candidates and the verdict in this task's Notes —
`docs/dark-palette-exploration.md` is the format precedent but two or three candidates
don't warrant their own doc.

**3. Add both entries** at the end of `themes[]` in `themes/candela-themes.json`, following
the shipped entries' shape exactly: `id`, `name` (`"25 · Harbor"` / `"26 · Harbor Night"`),
`tone`, `tags` (non-empty; `harbor-night` includes `"dark"`), `mode`, `description`, `fonts`
(reuse fonts already in the JSON — no new font dependencies), and the full `colors` block
with every token present.

Numbering: append as 25/26 rather than renumbering. Light themes currently occupy 01–14 and
darks 15–24, so a light at 25 breaks that grouping in the gallery's "All" view. Renumbering
would rename every `docs/screenshots/examples/candela-<NN>-<id>.png` and rewrite the README
table — not worth the churn for an ordering cosmetic. See Notes for the cheaper fix if it
ends up bothering.

**4. Validate and eyeball.**
- `python3 -m json.tool themes/candela-themes.json > /dev/null`
- `node scripts/validate.js` — exit 0, and no new warnings beyond the 9 accent-hue warnings
  `main` already emits (capture before/after if one appears)
- `npm run build`
- `cd app && npm ci && npm run build` (`app/src/derive.test.ts` iterates dark builtins, so
  `harbor-night` enters that test's input set)
- `npm run app`, open `/themes`, check both new cards' syntax panes and the diagnostics pane
  for hue collisions and muddy `faint`/`border`

**5. Publish surfaces.**
- `README.md`: two rows in the theme table, two gallery rows, and the dark-companions prose
  (currently written for ten darks).
- `AGENTS.md:3`: the "24 color themes (14 light and 10 dark)" count → 26 (15 / 11).
- `npm run app:screenshots` writes `docs/screenshots/examples/candela-25-harbor.png` and
  `candela-26-harbor-night.png`; PNGs are committed.
- Sweep tracked docs for other theme counts that drift. `docs/marketplace-listing.md`
  deliberately forbids counts — leave it. Skip with a one-line reason if nothing else needs it.

**Boundary.** Owns `themes/candela-themes.json`, `README.md`, `AGENTS.md`,
`docs/screenshots/examples/`. Excludes `lib/rules.js`, `lib/emitters.js`, `app/src/`, and
every existing palette — if a candidate can't pass the rules, retune the candidate, never
the rule. No release dispatch; that's a separate `/release` decision.

## Acceptance criteria

- `themes/candela-themes.json` holds 26 themes, 11 with `mode: "dark"`, both new entries defining every token present in the shipped entries.
- `harbor` reads as a warm cream ground with deep blue leading, and is not a near-duplicate of `apricot`, `sepia-paper`, or `ink-coral`.
- Two or three `harbor-night` ground candidates were validated and rendered, the user picked one, and the shipped dark does not read as a fourth `nocturne` / `blue-hour` / `azure-mono`.
- `node scripts/validate.js` exits 0 with no new warnings; `npm run build` and the `app/` build both pass.
- README's theme table, dark-companions prose, and gallery grid all list 26 themes with working image paths; `AGENTS.md` states 26 themes (15 light / 11 dark).
- `docs/screenshots/examples/` contains committed PNGs for both new themes.
- Notes records the dark candidates, their validator results, and why the shipped one won.

## Notes

- Origin: a Slack "Surprise me" custom theme — `#1264a3` navigation, `#fff0eb` selected,
  `#e296b9` presence, `#e8a991` notifications. Kept here so the heritage is traceable the
  way `nocturne`'s One Dark lineage is. During implementation the user clarified the real
  reference: Slack's *window gradient* + *darken sidebars*, which fades harbor blue at the
  top into burnt rust at the bottom ("an upside-down sunset"), with a salmon highlight on a
  near-white page. The flat four hexes were never the target.
- **Shipped intent: one harbor at either end of the day.** Named `25 · Harbor Dawn` and
  `26 · Harbor Dusk` rather than the spec's Harbor / Harbor Night — the pair is easier to
  reason about that way and the user chose it during implementation. Ids stay `harbor` /
  `harbor-night`, so build paths, gallery URLs and screenshot filenames are unaffected.
  - **Dusk** (dark) is authored from two anchors in HSL: watery blue (hue 199) as the ground
    and a dark sunset orange (hue 24) leading over it, with `selection #573729` carrying the
    rust the sky fades into. Blue + orange is also `AGENTS.md`'s colorblind-safe pairing.
  - **Dawn** (light) is the mirror, and deliberately *not* the same palette lightened. Its
    warm anchor is **gold** (hue 36), not dusk's orange — the optical difference between
    sunrise and sunset light — and its structural move is a **deep harbor blue `ink`**
    (`#17364f`, saturation 0.55). Every other light theme's `ink` is near-neutral; the next
    most colored is `lagoon` at 0.23, and eleven of fourteen sit under 0.20. `punct` is cool
    too, so the night lingers in the quiet roles while gold leads the loud ones.
- **Why the first light attempt was scrapped.** v1 was the blue on `kw` over a pale peach
  page. It validated clean but read as generic, and the measurement said why: its accent hue
  inventory (199, 88, 24, 340, 268, 176) is within a few degrees of `apricot`, `sepia-paper`
  and `solarized-lite`. Only the blue/orange role assignment differed, so a pale warm ground
  plus that hue set reproduced `apricot`'s recipe (mean CIELAB ΔE 17.4 to `apricot`, 15.2 to
  `ink-coral` — the two nearest of all fourteen). Fixing it needed a structural change, not
  retuning: hence gold-led accents and colored ink. Honest caveat for whoever revisits this:
  on the flat all-tokens-equal metric Dawn scores *nearer* `apricot` (12.3) than v1 did,
  because the paler ground pulls the average in. The divergence is concentrated in `ink` and
  `punct`, which is where the eye actually spends its time — area-weighted, the nearest
  neighbour is `sepia-paper` at 14.9 with everything else bunched 15–24, no standout twin.
- **Dark ground candidates** (all three validated clean — zero failures, zero warnings,
  6 accent hues each — and rendered in the explorer):
  - **A · navy `#14263c`** — peach `kw` on a true navy. Clearly none of the three shipped
    near-neighbours, and the closest to the seed. Preferred over B and C.
  - **B · blue-gray `#1f2a33`** — desaturated slate, blue `kw`. Rejected: reads as a fourth
    `nocturne` (`#282c34`), exactly the failure mode the spec warned about.
  - **C · warm charcoal `#201d1c`** — neutral warm ground, blue + peach accents. Rejected:
    highest accent contrast of the three, but its ground sits in `ember` / `hearth` /
    `amber-mono` territory, so the warm-dark slot is already crowded.
  - **Shipped: A's territory, re-derived from the two anchor hues** as `bg #132939` — a
    deeper, cyan-leaning water rather than A's flat navy, once the brief became "watery
    sunset blue" rather than "Slack's sidebar". `selection #573729` puts the gradient's rust
    bottom into the UI, so a deleted diff line reads rust-on-water.
- Both shipped themes pass with margin: every AA token ≥ 4.86:1 on `bg` (light) and ≥ 5.39:1
  (dark), `ink` on `surface` ~12:1 / ~9.9:1, `error`/`ok` grayscale separation 1.49 / 1.59.
- If the 25-after-24 ordering looks wrong in the gallery's "All" view, the cheap fix is
  sorting light-then-dark in `app/src/Gallery.tsx` (it renders in raw JSON array order
  today, no sort) — a separate task, out of this boundary.
- Related: task 064 emits Slack custom themes from Candela palettes, closing the loop in the
  other direction.
- Screenshots: `docs/screenshots/examples/` (gallery cards, referenced by the root README)
  and `docs/screenshots/jetbrains/` (1200x760 listing frames, uploaded by hand) both hold
  committed PNGs for the pair. The colored-`ink` precedent is logged as D13.
- Left alone deliberately: `docs/dark-palette-exploration.md` and D12 are dated records of
  the 21–24 exploration, still accurate. `docs/marketplace-listing.md` forbids theme counts
  by design. `workflow/ready/062-xcode-colorscheme-format.md:74` says "24 theme files" and is
  now stale, but it belongs to another task and is outside this boundary.
