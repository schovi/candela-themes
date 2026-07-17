# 008 — Accessibility contrast pass: palettes, validator floors, honest prose

done: 2026-07-17

## What & why

A second-eye review (measured audit + external research, condensed into
`docs/vision-research.md`) found the palettes don't yet live up to the project's own
eye-comfort mission: comments sit at ~2.1–3.0:1, a dozen syntax tokens fall below WCAG
AA against `bg`, `error` is literally the same hex as `num` in 5 themes, and the
red/green diagnostics are confusable for deuteranopes in most themes. The README also
states one inverted vision claim (white-bg "halation") and two overreaches. Fix the
colors in the source JSON, make the new floors hard validator gates so they can't
regress, regenerate `dist/`, and correct the prose. `docs/vision-research.md` is the
normative reference for every rule below.

## Spec

All color edits happen only in `docs/design-handover/aurora-themes.json`; `dist/` is
regenerated via `node scripts/generate.js`. Lift failing tokens minimally — preserve
each theme's hue character; darken/adjust rather than rehue, except diagnostics.

**1. Raise `faint` (comments) to ≥ 4.5:1 vs `bg` in all 14 themes.** Decided: full AA,
not a compromise floor. Keep comments quieter than `ink` via hue/desaturation.

**2. Lift every syntax token to ≥ 4.5:1 vs `bg`** (binding surface — terminals render on
`bg`; `surface` is lighter so it passes for free). Measured offenders (vs `bg`):
meadow `num` 3.05, apricot `kw` 3.61, periwinkle `type` 3.58, lagoon `str` 3.64,
blossom `builtin` 3.65, slate-mist `builtin` 3.75, graphite `punct` 3.37, eink `punct`
3.47, plus every value between 3.6 and 4.5 in the audit — recheck all tokens
computationally, don't trust this roster.

**3. Rebuild diagnostics per-theme under hard rules** (decided: per-theme character, not
a uniform triad):
- Unique hexes: `error` ≠ `num`, `warning` ≠ `kw`/`num`, `ok` ≠ `error`. Today
  blossom/lagoon/apricot/periwinkle/tungsten share `error`=`num`.
- `error` leans vermillion/orange-red; `ok` leans blue-green/teal; the pair is
  luminance-separated enough to read in grayscale (today error/ok luminance ratios are
  1.02–1.22 almost everywhere).
- All three ≥ 4.5:1 vs `bg`.
- `ok` may still equal `str` only if `str` already satisfies the `ok` hue rule.

**4. Purple/blue separation.** Where `type` or `kw` is purple and `fn` is blue at
similar lightness (apricot, sepia-paper, graphite worst), shift lightness apart —
protans/deutans collapse purple into blue.

**5. Extend `scripts/validate.js` (hard gates, decided):**
- every syntax + diagnostic token and `faint` ≥ 4.5:1 vs `bg`;
- `ink` vs `selection` ≥ 4.5:1;
- diagnostic hex-uniqueness rules from (3).
Warn-only (judgement calls, like the hue count): error/ok grayscale separation and a
protan/deutan-simulation distance check if cheap to implement inline.

**6. Prose corrections in `docs/design-handover/README.md`:**
- "Why light themes hurt" claim 1: halation is a *dark-mode* phenomenon worsened by
  astigmatism (the actual argument *for* light themes); white backgrounds cause glare.
- Soften "21:1 is too harsh/shimmer" to a stated comfort preference.
- Tungsten's low-blue rationale: sleep hygiene, not eye strain.
- "6–8 hues": desaturation is the load-bearing rule, the count is consistency/taste.
- Update the "Design rules to preserve" list to include the new floors; link
  `docs/vision-research.md` instead of restating the research.

**7. Sync downstream copies:** update the CSS variables in
`docs/design-handover/*.dc.html` for every changed color (hand-maintained, no build
step); update the invariants line in `workflow/AGENTS.md` Local notes; regenerate and
commit `dist/`.

Boundary — production surfaces: `aurora-themes.json` (all 14 themes), `scripts/validate.js`
(+`lib/colors.js` if helpers needed), `docs/design-handover/README.md`,
`docs/design-handover/*.dc.html`, `workflow/AGENTS.md`, regenerated `dist/`.
Exclusions: no new themes, no generator/emitter changes, no APCA migration, no rehue of
tokens that already pass, E-Ink Slate stays near-grayscale (its CVD safety is the absence
of hue coding — contrast floors apply, hue rules for diagnostics apply in muted form).

## Acceptance criteria

- `node scripts/validate.js` enforces the new hard gates and exits 0 on the shipped JSON;
  deliberately dropping any token below a floor exits non-zero naming theme + token.
- No token in any theme measures below 4.5:1 against `bg` (syntax, diagnostics, `faint`).
- `ink` on `surface` still ≥ 7:1 in all themes; existing invariants untouched.
- No theme has `error` = `num` or `warning` = `kw`/`num`; error/ok pairs pass the
  grayscale-separation warn check or the exception is noted in the task on completion.
- `dist/` regenerated and committed together with the JSON; showcase `.dc.html` CSS
  variables match the JSON for changed tokens (spot-check a few themes by eye).
- README no longer claims white-background halation, links `docs/vision-research.md`,
  and its design-rules list matches what validate.js enforces.

## Notes

Research + audit provenance: docs/vision-research.md (rules and citations). Audit
method: WCAG relative-luminance ratios per token per theme plus Viénot-style
protan/deutan simulation; re-run after edits rather than reusing the numbers above.
Eyeball the showcase after regenerating — validation can't judge feel, and this pass
touches every theme.

On completion:
- `dist/` was NOT committed. `dist/` and `build/` are gitignored (`.gitignore`, root
  CLAUDE.md/AGENTS.md, docs README all state generated output is never committed;
  `node scripts/generate.js` writes `build/`, not `dist/`). Committing them would break
  that contract, so generation was only *run* to verify colors flow through (it does).
  The spec's "commit dist/" is the one item deliberately not fulfilled literally.
- Validator gates were added to `lib/rules.js` (not `scripts/validate.js`): task 010
  landed first and moved the shared rule definitions there so the app playground and the
  CLI validator can't diverge. Gates therefore also guard the app's gated export.
- error/ok grayscale separation is now 1.37–1.39 (was 1.02–1.22); protan/deutan sim
  distance ≥ 36 (was as low as 9.9). Both warn-only checks pass on all 14 themes.
- Purple/blue separation applied to the named offenders (sepia, apricot, lagoon,
  slate-mist) by darkening blue `fn` below the purple token. Skipped for E-Ink (hue is
  not load-bearing there) and for graphite-mono (no purple token — its near-mono blue is
  the theme's stated concept). periwinkle's indigo `kw` + purple `fn` were left as its
  documented "indigo/purple leads" identity; both pass contrast, and separating them
  would need a rehue the spec excludes for passing tokens.
