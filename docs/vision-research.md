# Vision & color research

What the vision-science and accessibility literature actually supports, gathered while
auditing the Candela design claims (2026-07). This is the normative reference for contrast
floors and color-vision rules; `AGENTS.md` ("Design rules to preserve") states the resulting
invariants, this file records why they hold and where the original rationale was wrong.

## Eye-comfort facts

**Halation is a dark-mode phenomenon, not a light-mode one.** Light text on dark
backgrounds blooms/glows ("halation"), and astigmatism makes it dramatically worse —
dark backgrounds dilate the pupil, exposing more of the imperfect cornea/lens. This is
the documented reason astigmatic users (roughly half the population to some degree) do
better on light backgrounds, and it is Candela's strongest selling point. What a pure
`#ffffff` background causes is *glare* — a real but weaker-documented complaint that
off-white/tinted paper plausibly softens.
Sources: [Level Access on astigmatism](https://www.levelaccess.com/blog/accessibility-for-people-with-astigmatism/),
[NN/g dark mode research summary](https://www.nngroup.com/articles/dark-mode/),
[dark-mode myth debunk](https://stephaniewalter.design/blog/dark-mode-accessibility-myth-debunked/).
Caveat: people with cataracts/cloudy media or severe photophobia genuinely do better in
dark mode; light themes are a preference for a population, not a universal prescription.

**"Pure black on white (21:1) is harmful" is practitioner lore, not science.** Contrast
polarity studies show reading performance *rises* with contrast, and low-vision users
read best at maximal contrast. Choosing ~7–15:1 dark-gray-on-off-white is a legitimate
comfort preference — but frame it as taste, never as "21:1 hurts". That is also why
Contrast Max exists.
Sources: [WCAG 1.4.6 Understanding](https://www.w3.org/WAI/WCAG21/Understanding/contrast-enhanced.html),
[UX Movement (the lore, with its own caveats)](https://uxmovement.com/content/why-you-should-never-use-pure-black-for-text-or-backgrounds/).

**Chromatic aberration fringing is about saturation, not hue count.** The eye cannot
focus all wavelengths at once, so highly saturated text (worst in the blue channel)
produces fuzzy edges; refractive error compounds it. Desaturating accents is the
load-bearing rule. "6–8 hues" is a taste/consistency guideline, not a vision constraint.
Sources: [W3C WCAG 3 visual contrast how-to](https://www.w3.org/WAI/GL/WCAG3/2021/how-tos/visual-contrast-of-text/),
[ARC guide](https://www.readtech.org/ARC/guides/designing-with-visual-contrast/).

**Low-blue palettes help sleep, not eye strain.** Evening short-wavelength light
suppresses melatonin (small effect at screen intensities); the 2023 Cochrane review and
the American Academy of Ophthalmology find blue light does *not* cause digital eye
strain — reduced blinking and accommodation do. Tungsten's pitch is sleep hygiene.
Sources: [AAO](https://www.aao.org/eye-health/tips-prevention/are-computer-glasses-worth-it),
[Cochrane review](https://pubmed.ncbi.nlm.nih.gov/42349548/).

## Contrast rules

**WCAG 2 ratios are trustworthy for this regime.** WCAG 2's known failure mode is
dark-on-dark (it over-passes); for dark text on light/off-white backgrounds it tracks
perception well. APCA mapping: Lc 60 ≈ 4.5:1, Lc 75 ≈ 7:1; APCA recommends Lc 75–90 for
body text. So `ink` ≥ 7:1 on `surface` satisfies both models — sound, keep it.
Sources: [APCA in a nutshell](https://git.apcacontrast.com/documentation/APCA_in_a_Nutshell.html),
[Myndex WCAG comparison](https://github.com/Myndex/SAPC-APCA/discussions/30).

**Every syntax token needs ≥ 4.5:1 (WCAG AA) — against `bg`, not just `surface`.**
Syntax colors are normal-size informational text; SC 1.4.3 has no code exemption. AA is
the accepted floor (GitHub Primer rebuilt its themes to it; Eric Bailey's
a11y-syntax-highlighting targets it per token, and notes AAA across all accents is
infeasible on light backgrounds — the colors converge and stop being highlighting).
Terminals render on `bg`, which is darker than `surface`, so `bg` is the binding check.
Sources: [a11y-syntax-highlighting](https://github.com/ericwbailey/a11y-syntax-highlighting),
[GitHub contrast improvements](https://github.blog/changelog/2023-03-28-light-and-dark-theme-color-contrast-improvements/).

**Comments are not exempt.** WCAG's incidental-text carve-out covers decorative/disabled
content only; comments convey information. Solarized's ~2.8:1 comments are the canonical
cited defect (it's why Selenized exists). Comments may read quieter than `ink` via hue,
but must clear 4.5:1.
Sources: [Understanding SC 1.4.3](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html),
[What's wrong with Solarized](https://github.com/jan-warchol/selenized/blob/master/whats-wrong-with-solarized.md),
[Tonsky: comments should be prominent](https://tonsky.me/blog/syntax-highlighting/).

**Selection must not repaint text, and text on selection stays ≥ 4.5:1.** WCAG treats
highlighted text as text-on-new-background; VS Code's theming docs require selection
backgrounds that let syntax colors show through (`selectionForeground` is for
high-contrast themes only).
Source: [VS Code theme-color reference](https://code.visualstudio.com/api/references/theme-color).

## Color-vision deficiency rules

**Blue + orange is the canonical CVD-safe pair** — it survives protanopia, deuteranopia
and tritanopia, which is exactly why Okabe-Ito (Color Universal Design) builds around
blue/sky-blue/orange/vermillion. Candela's anchor choice is validated.
Source: [Okabe-Ito / CUD](https://jfly.uni-koeln.de/color/).

**Purple is the trap next to blue.** For protans/deutans, purple's red component
vanishes and it collapses into blue. When `type`/`kw` are purple and `fn` is blue at
similar lightness, they merge. Fix by luminance-separating purple from blue, not by
changing hue.

**Red/green diagnostics must survive grayscale.** Deutans see same-brightness red and
green as the same brownish tone. The standard mitigations (all three, together):
1. Shift red toward vermillion/orange-red (`#D55E00`-style) and green toward
   blue-green/teal (`#009E73`-style) — hues that sit off the red-green confusion axis.
2. Separate the pair in luminance so it still reads in grayscale.
3. Never rely on the hue pair alone — editors add icons/underlines, but the theme should
   not make color the only difference either.
GitHub shipped dedicated colorblind themes because tuned red/green alone still failed
users — treat that as the cautionary tale.
Sources: [Okabe-Ito](https://jfly.uni-koeln.de/color/),
[Primer colorblind-theme issues](https://github.com/primer/github-vscode-theme/issues/394).

## Derived invariants for Candela

The rules above condense to (enforced by `scripts/validate.js`, stated in
`AGENTS.md`, "Design rules to preserve"):

- `ink` on `surface` ≥ 7:1 (AAA); no pure `#ffffff` bg / `#000000` ink.
- Every syntax and diagnostic token, and `faint`, ≥ 4.5:1 (AA) against `bg`.
- `ink` on `selection` ≥ 4.5:1; selection never repaints text.
- Diagnostics use unique hexes (`error` ≠ `num`, `warning` ≠ `kw`/`num`); `error` leans
  vermillion, `ok` leans blue-green, and the pair is luminance-separated.
- Purple tokens sit at a different lightness than the blue ones.
- Accents stay desaturated (the anti-fringing rule); the 6–8 hue count is taste.
