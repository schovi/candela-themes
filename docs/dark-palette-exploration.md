# Dark palette exploration

The light half of the set carries four deliberate experiments — near-monochrome
(`graphite-mono`), low-blue evening (`tungsten`), ultra-low chroma (`eink-slate`),
acuity-first (`contrast-max`). This doc explores what each of those four ideas becomes on a
dark ground: eight candidate palettes, all originals, each validated and rendered.

**Outcome.** All four recommended candidates shipped; the rest stand as findings.

| Candidate | Shipped as |
| --- | --- |
| B1 · arclight | `arclight` — 21 · Arclight |
| D1 · mono-amber | `amber-mono` — 22 · Amber Mono |
| A1 · candlelit | `hearth` — 23 · Hearth, after the retune its section calls for |
| D2 · mono-azure | `azure-mono` — 24 · Azure Mono |

B2 and A2 did not ship, and the ultra-low-chroma category was dropped for dark — the
sections below hold the evidence for all three calls. `themes/candela-themes.json` is the
source of truth for what the shipped four actually contain; the token blocks here are the
candidates as validated, so `hearth` differs from A1 by design. Token roles and the
invariants every candidate has to clear live in [`../AGENTS.md`](../AGENTS.md); the vision
science behind them lives in [`vision-research.md`](vision-research.md).

## How each candidate was checked

Two passes, both real:

- **Rules.** Every candidate ran through `checkTheme` from `lib/rules.js` — the same
  function `scripts/validate.js` gates on — in a scratch harness outside the repo. Verdicts
  below quote what it returned, never an eyeball estimate. `passes` means zero hard
  failures; the warn-only checks (accent-hue count, error/ok separation) are named where
  they fired.
- **Render.** Each candidate was rendered by the `app/` explorer across the four default
  panes (terminal, TypeScript with a live problem, Markdown, git) and looked at. A palette
  that clears every rule and still reads muddy is rejected here, and that is a result.

One structural finding applies to all four categories, so it is stated once: **on a dark
ground every informational token has to be lighter than the background to clear AA, so the
whole palette is pushed into a narrow bright band.** On light grounds accents move *down*
into a wide, roomy range (near-black through mid-gray) and can differ in lightness freely.
Dark grounds do not have that room. Every constraint fight below is a version of this.

## Evening / low-blue

**In dark:** a warm amber-rose ground with short-wavelength blue stripped out of the
accents, the way `tungsten` does it in light. No cool token except a green.

**The constraint fight:** the accent-hue count. Removing blue and violet leaves warm hues
plus one green, so the 6–8 distinct-hue heuristic cannot be met — both candidates warn at
2–3 hues. That warning is inherent to the category, not a defect: `tungsten` itself ships
warning at 3. The real cost is downstream of it — with every accent inside a 60-degree arc,
tokens have to separate by lightness alone, and the bright band leaves little of that.

### A1 · candlelit

```json
{
  "mode": "dark",
  "bg": "#241c17",
  "surface": "#2c231c",
  "border": "#4e3f31",
  "ink": "#e8d6bc",
  "ink2": "#a89279",
  "faint": "#a08b70",
  "selection": "#453527",
  "cursor": "#f0a13c",
  "lineHighlight": "#2e241c",
  "kw": "#e59a5e",
  "str": "#c6bf62",
  "fn": "#e0b878",
  "num": "#e08a63",
  "type": "#d0a678",
  "builtin": "#b6c477",
  "punct": "#e8d6bc",
  "error": "#ec7a5c",
  "warning": "#dbae4a",
  "ok": "#a8c98d"
}
```

Verdict: **passes with warnings** — 2 distinct accent hues.
Reads exactly like its name: a lit room, no glare anywhere, the most restful of the eight.
But `kw`, `fn`, `type` and `num` are all amber within a few degrees of hue and one step of
lightness, so in the TypeScript pane a keyword, a function name and a type annotation are
hard to tell apart at a glance; only `str` and `builtin` (the two greens) break out.

### A2 · rosewood

```json
{
  "mode": "dark",
  "bg": "#251a1c",
  "surface": "#2d2022",
  "border": "#513a3c",
  "ink": "#ecd3cc",
  "ink2": "#ab8d87",
  "faint": "#a68a84",
  "selection": "#4a3234",
  "cursor": "#f09a70",
  "lineHighlight": "#2f2224",
  "kw": "#e79a94",
  "str": "#c9bd6e",
  "fn": "#e6b389",
  "num": "#df8f7c",
  "type": "#d7a9a0",
  "builtin": "#c0c081",
  "punct": "#ecd3cc",
  "error": "#f07a6d",
  "warning": "#dcae55",
  "ok": "#a9c896"
}
```

Verdict: **passes with warnings** — 3 distinct accent hues.
The rose-brown ground is the more distinctive of the pair and separates cleanly from every
shipped dark. Its problem is worse than A1's, though: `ink` is tinted rose, and `kw` and
`type` sit close enough to it in both hue and lightness that punctuation, identifiers and
type names blur into one wash. Rejected as authored — it would need `ink` pulled toward
neutral before it is usable.

## Acuity-first

**In dark:** a near-black ground with accents pushed well past AA toward AAA, for eyes where
sharpness rather than glare is the limiter — `contrast-max` inverted.

**The constraint fight:** hue identity. On light grounds AAA accents go dark and saturated,
which is where hues are most distinct. On a near-black ground AAA forces accents *up* past
roughly 10:1, and at that lightness every hue desaturates toward pastel. You get the
legibility; you pay for it in accents that all read candy-bright. Both candidates cleared
every rule including the warn-only checks, which no other category managed.

### B1 · arclight

```json
{
  "mode": "dark",
  "bg": "#0e0f11",
  "surface": "#171a1d",
  "border": "#3d4349",
  "ink": "#eef1f4",
  "ink2": "#a7b0b8",
  "faint": "#9aa3ab",
  "selection": "#33414f",
  "cursor": "#ffd166",
  "lineHighlight": "#16191c",
  "kw": "#ffb0d8",
  "str": "#8ce8a8",
  "fn": "#8fc0ff",
  "num": "#ffc07a",
  "type": "#d2b0ff",
  "builtin": "#7fe0e8",
  "punct": "#eef1f4",
  "error": "#f2857e",
  "warning": "#f2d05a",
  "ok": "#6fe0c0"
}
```

Verdict: **passes** — no warnings.
The sharpest of all eight. Every token separates instantly, the diagnostics pane is
unambiguous, and the near-black ground has no halation. The pastel register does land close
to `borealis` in feel, which is the honest cost of the constraint above — it is
distinguishable by its far deeper ground and its much higher accent contrast, not by hue.

### B2 · signal

```json
{
  "mode": "dark",
  "bg": "#101014",
  "surface": "#1a1a20",
  "border": "#42434d",
  "ink": "#f2f2f7",
  "ink2": "#adaeb8",
  "faint": "#a3a4ae",
  "selection": "#383a4a",
  "cursor": "#ffcc33",
  "lineHighlight": "#18181e",
  "kw": "#ff9ec4",
  "str": "#9ce89c",
  "fn": "#9cbcff",
  "num": "#ffb066",
  "type": "#c9a6ff",
  "builtin": "#7fe4f0",
  "punct": "#f2f2f7",
  "error": "#ff8f88",
  "warning": "#ffd75e",
  "ok": "#66e2b8"
}
```

Verdict: **passes** — no warnings.
Renders a near-duplicate of B1: same near-black ground, same pastel accent register, a
little more saturation. Shipping both would be shipping one idea twice. Its own finding is
that the acuity-first dark constraint collapses the design space — two independently
authored attempts converged.

## Ultra-low chroma

**In dark:** near-grayscale syntax on an OLED-friendly deep ground, the dark reading of
`eink-slate`.

**The constraint fight:** this is the category the bright-band problem kills. `eink-slate`
works in light because near-gray accents can sit anywhere from `#3d4d4a` to `#676b6c` — a
usable lightness spread — while still being darker than the paper. On a dark ground the AA
floor puts every token above roughly `#999`, and with chroma deliberately near zero,
lightness is the *only* remaining channel. Seven tokens do not fit in what is left of it.

### C1 · obsidian

```json
{
  "mode": "dark",
  "bg": "#050505",
  "surface": "#0e0f0f",
  "border": "#333636",
  "ink": "#d8dad9",
  "ink2": "#8e9291",
  "faint": "#8b8f8e",
  "selection": "#2c3130",
  "cursor": "#c8a86a",
  "lineHighlight": "#0c0d0d",
  "kw": "#a9b4b1",
  "str": "#adb6a9",
  "fn": "#a6b0ba",
  "num": "#b8ada4",
  "type": "#aca6b6",
  "builtin": "#a4b6b0",
  "punct": "#d8dad9",
  "error": "#b4867f",
  "warning": "#b8a98c",
  "ok": "#a6cbbc"
}
```

Verdict: **passes with warnings** — 3 distinct accent hues.
**Rejected on render.** The ground itself is the best of the eight — a true OLED near-black
with no glow at all. The syntax is unusable: keyword, string, function, number and type all
read as the same warm gray, so the TypeScript pane looks like unhighlighted plain text. The
rules pass and the theme still fails at its job.

### C2 · graphite-night

```json
{
  "mode": "dark",
  "bg": "#17181a",
  "surface": "#1f2022",
  "border": "#3f4143",
  "ink": "#d5d8da",
  "ink2": "#8f9295",
  "faint": "#8c8f92",
  "selection": "#33373a",
  "cursor": "#c9a96b",
  "lineHighlight": "#1d1e20",
  "kw": "#a8b6c0",
  "str": "#aab8ab",
  "fn": "#a4aec2",
  "num": "#bcb0a4",
  "type": "#b0a8bc",
  "builtin": "#a2b8b4",
  "punct": "#d5d8da",
  "error": "#bc8b83",
  "warning": "#bdad8e",
  "ok": "#a3c6b9"
}
```

Verdict: **passes with warnings** — 4 distinct accent hues.
**Rejected on render.** Lifting the ground to `#17181a` buys a little more room below the AA
floor, and the tint separation is marginally better than C1's — `kw` reads faintly blue
against `num`'s faint tan if you look for it. Still not enough to work at reading speed.
Two attempts, same wall.

## Near-monochrome

**In dark:** grays plus a single accent hue carrying all of the syntax meaning, the way
`graphite-mono` uses one blue in light.

**The constraint fight:** the diagnostics rules. `error` must lean vermillion, `ok` must
lean blue-green, they must be unique hexes and luminance-separated — so a "one hue" theme is
forced to admit a second and a third. `graphite-mono` solves it the same way and lives with
the 1-hue warning; both candidates below do too. Unlike the ultra-low-chroma category, the
bright band is survivable here: the grays only need to differ from each other, and one
saturated hue against them is easy to see.

### D1 · mono-amber

```json
{
  "mode": "dark",
  "bg": "#1b1917",
  "surface": "#232120",
  "border": "#454240",
  "ink": "#dcd8d3",
  "ink2": "#948f89",
  "faint": "#918c86",
  "selection": "#3a3633",
  "cursor": "#f0a83c",
  "lineHighlight": "#211f1d",
  "kw": "#e8a94e",
  "str": "#f0c987",
  "fn": "#b8b2ab",
  "num": "#a8a29b",
  "type": "#c8c2ba",
  "builtin": "#e8a94e",
  "punct": "#dcd8d3",
  "error": "#d1786a",
  "warning": "#c9b06a",
  "ok": "#8dc4b0"
}
```

Verdict: **passes with warnings** — 1 distinct accent hue (the same warning `graphite-mono`
ships with).
Works. Amber keywords and built-ins carry the structure against neutral grays, pale gold
strings read as a second step of the same hue, and the whole thing looks like a warm
terminal rather than a stripped-down editor. The teal `ok` is the only cool note on screen
and it earns its place in the git pane.

### D2 · mono-azure

```json
{
  "mode": "dark",
  "bg": "#181a1c",
  "surface": "#202224",
  "border": "#424547",
  "ink": "#d6dade",
  "ink2": "#8e9296",
  "faint": "#8b8f93",
  "selection": "#353a3e",
  "cursor": "#e8b45c",
  "lineHighlight": "#1e2022",
  "kw": "#78b4e8",
  "str": "#a8d0ee",
  "fn": "#b0b6bb",
  "num": "#a0a6ab",
  "type": "#c4cacf",
  "builtin": "#78b4e8",
  "punct": "#d6dade",
  "error": "#d8806f",
  "warning": "#cbb26c",
  "ok": "#8ac4b0"
}
```

Verdict: **passes with warnings** — 1 distinct accent hue.
Works as well as D1 and is the more faithful translation of `graphite-mono`, since it keeps
that theme's blue. The cost is placement: blue-accent-on-dark is `nocturne`'s and
`blue-hour`'s register already, so it adds a fourth cool dark to a set that has plenty.

## Ranked recommendation

Four of eight are worth shipping, in this order:

1. **B1 · arclight** — the only candidate that clears every rule with zero warnings, and
   acuity-first is a real gap: nothing in the six shipped darks is tuned for sharpness over
   glare.
2. **D1 · mono-amber** — near-monochrome demonstrably survives the move to dark, and amber
   is a hue no shipped dark owns.
3. **A1 · candlelit** — the set has no dark evening theme at all, and this is the restful
   one; ship it only with `str` and `builtin` pushed further from the amber cluster, or
   accept weak keyword/type discrimination.
4. **D2 · mono-azure** — sound palette, but it lands in territory `nocturne` and `blue-hour`
   already hold. Ship it only if a second near-monochrome is wanted.

Not recommended:

- **B2 · signal** — a near-duplicate of B1 in render; one acuity-first dark is enough.
- **A2 · rosewood** — the rose-tinted `ink` collapses into its own accents. Fixable, but A1
  is the better starting point for the same category.
- **The whole ultra-low-chroma category.** Both C candidates pass every hard rule and both
  are unreadable. The AA-against-`bg` floor confines every token to a narrow bright band,
  and with chroma near zero there is no second channel left to separate them. `eink-slate`
  has no dark counterpart because the physics of the constraint does not allow one — not
  because nobody tried. Revisit only if the invariant that binds informational tokens to
  `bg` ever changes.

One observation for whoever works on the rules next: `lib/rules.js` forbids a pure-white
`bg`/`surface` and pure-black `ink`, but nothing stops a pure-black `bg`. C1 used `#050505`
by choice rather than by constraint, since a literal `#000000` maximizes the smear the deep
ground is supposed to avoid.
