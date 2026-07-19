# Editor review — comprehensive testing & validation

**Target:** `http://localhost:5177/editor` (app dev server, `bun app`)
**Date:** 2026-07-19
**Method:** Live browser testing by three independent reviewers with different charters:
a visual designer, a frontend developer (functional QA), and a non-technical first-time
user. Entry points covered: resumed draft, fresh start screen, deep links (valid,
invalid, prefixed-id), Simple↔Pro switching, wizard happy path, validation/auto-fix,
export gating, persistence across reloads.

---

## Executive summary

The editor is a genuinely well-crafted tool, not a settings form. The identity is
coherent across `/`, `/themes`, and `/editor` (warm paper chrome, serif display + mono
micro-labels, navy actions). The live preview panes are the standout: realistic
terminal/code/markdown/git samples that update instantly and teach cause-and-effect
better than any copy. Functionally it is solid — clean console across ~10 sessions,
live validation with human-readable rule messages, a near-minimal auto-fix, real
`disabled` semantics on export buttons, and reliable localStorage persistence of draft,
mode, and pane choices.

The problems cluster in three areas:

1. **Brand contradiction in Simple mode** — a fully saturated RGB color wheel is the
   loudest element in a product whose thesis is "resist neon".
2. **Novice comprehension gaps** — the token chips (`kw`, `str`, `punct`…), some
   validation copy, and the export choices are expert-speak with no tooltips or
   plain-language layer.
3. **Trust/consistency edges** — the Contrast helper can silently flip a light theme to
   a dark background while validation stays green; the displayed draft id looks like a
   deep-link id but isn't; Pro→Simple discards more than its confirm promises.

Non-technical task success: **7/10** — the persona built and validated a "cozy green"
theme unaided, stumbling on chip names, one undecipherable warning, and the export gate.

---

## Consolidated findings (ranked)

Severity reflects impact on the product's own goals (novice-friendly Simple mode,
light-theme brand, trust in validation).

### High

| # | Finding | Seen by | Detail |
|---|---------|---------|--------|
| H1 | **Accent/token chips have no plain-language labels or tooltips.** `kw str fn num type builtin punct` are unguessable; verified no `title`/`aria-label` anywhere on the page. The core creative control of Simple mode is unreadable to Simple mode's target audience. | user, designer | Fix: human labels ("Keywords — `if`, `function`"), or hover-highlights the matching words in the preview (high-delight option). |
| H2 | **Simple mode's fully saturated RGB color wheel contradicts the anti-neon brand.** The neon wheel is the loudest element on the page; the marker sits on saturated colors while produced tokens are muted, so it also misrepresents output. | designer | Fix: render the wheel at the saturation/lightness range Candela actually ships (hue ring with desaturated core). |
| H3 | **Contrast helper at far-left silently inverts the theme to a dark background (`bg #41392f`) while validation stays green ("Ready to export, 0 hard failures").** One preview pane (terminal) rendered blank after the flip. Undermines both the light-theme promise and trust in the green state; validation never ties `bg` lightness to `mode`. | user | Fix: clamp the helper range for light drafts, or surface "this makes the background dark" inline; consider a validation rule linking `mode` to bg lightness. |
| H4 | **"Copy theme JSON" output would fail the repo validator despite the green "Ready to export".** `exportEntry` (Playground.tsx:354) strips `mode` and `tags`, but `lib/rules.js:91-97` — the same `checkTheme` that `scripts/validate.js` runs — hard-fails themes missing either. The editor's core promise ("green means it would ship as-is") is false for the primary contribution flow (paste into `themes[]` → validate). | code audit | Fix: include `mode` and `tags` in `exportEntry`. One-line change. |

### Medium

| # | Finding | Seen by | Detail |
|---|---------|---------|--------|
| M1 | **Pro→Simple discards more than the confirm promises.** Confirm says "discard manual token edits and re-derive the palette", but name, tone, and description also reset to defaults ("My Theme", custom). | dev, designer | Fix: carry name/tone/description over; rewrite confirm to state exactly what is lost. |
| M2 | **Displayed id ≠ deep-link id.** Editor shows `id: 01-sepia-paper` (slugified display name) but the canonical id and working deep link is `sepia-paper`; `?theme=01-sepia-paper` silently lands on the start screen. A user copying the displayed id gets a dead link. | dev | Fix: either display the canonical id when forking, or make the deep-link resolver accept the prefixed slug. |
| M3 | **Native `window.confirm()` on Start over, Pro→Simple, and deep-link-replace.** Breaks the otherwise fully crafted UI; the deep-link confirm fires synchronously during first render, which also freezes any automation/e2e tooling (empirically confirmed). | all three | Fix: in-app styled dialog. |
| M4 | **Resumed drafts load with zero context.** Returning (or arriving at a shared machine) drops you into someone's Pro-mode edit with no "Resuming draft 'X' — start fresh?" affordance beyond the unexplained red "Start over". | user | Fix: resume banner naming the draft, with a start-fresh action. |
| M5 | **Export offers three artifacts with no guidance.** "Tool zip" vs "full export" vs "Copy theme JSON" is undiscoverable without downloading; default target (iTerm2) assumes a terminal user; no link to install instructions from the editor. | user | Fix: one-liner per option + link to the README install docs next to the buttons. |
| M6 | **Expert-speak validation warnings.** "error/ok grayscale separation 1.01 < 1.3" gives a novice no idea what is wrong, whether it matters, or which control fixes it. | user, designer | Fix: one-sentence plain translation + pointer to the relevant control. |
| M7 | **Pro H/S/L sliders give no feedback.** Tiny letter labels, no numeric readouts, identical pale track for every channel (an H slider with no hue gradient is guesswork). | designer | Fix: channel-appropriate gradient tracks + numeric values. |
| M8 | **The pass state is undersold.** Failure state shouts (red list, blocked buttons); success collapses to a gray "Validation · 0 hard failures · 1 warning" with only a 12px green line. Remaining warnings get buried. | designer | Fix: green check + affirmation in the panel header; keep warning count amber. |

### Low

| # | Finding | Seen by | Detail |
|---|---------|---------|--------|
| L1 | Unknown `?theme=` id falls back silently — no "theme not found" notice. | dev | |
| L2 | Invalid hex (e.g. `zzz`) is persisted into the draft, surviving reload (flagged, recoverable — but the JSON panel then offers invalid theme JSON). | dev | |
| L3 | Empty theme name allowed and exportable (id falls back to `my-theme`); a ~500-char name is accepted → 494-char id/export filename. | dev | Cap the name; require non-empty. |
| L4 | Diagnostics sliders are unlabeled (they adjust hue) and labels can contradict live color — "warning (amber)" rendered green after sliding. | user | Label the axis; make the parenthetical follow the actual color. |
| L5 | "Finish wizard" has no completion moment — it silently expands into the long form; no "done, next: export" pointer. | user | |
| L6 | Per-token contrast table is raw data: no pass/fail glyphs, no threshold column, meaningless identity rows (bg on bg 1.00:1). | designer | |
| L7 | Validation panel sits collapsed at the very bottom, far from the controls that trigger it (top status line partially compensates). | user | |
| L8 | No hover feedback on buttons; disabled export buttons read as "tan" rather than disabled. | designer | |
| L9 | Pro token rail is a wall: ~20 tokens × (swatch + hex + 3 sliders) in an independently scrolling column. Consider collapsing H/S/L behind the swatch. | designer | |
| L10 | Start-screen wording leaks jargon: "Fork existing", "Upload JSON", "diagnostics" in the wizard blurb. | user | "Start from an existing theme", etc. |
| L11 | Transient blank terminal preview pane observed once after the dark-flip (H3). | user | |
| L12 | "Save draft" button is redundant with autosave (the "Saved automatically" label admits it). | dev | Consider removing. |

---

## Product & flow architecture

A follow-up pass focused on the product model itself (source: `Playground.tsx`,
`derive.ts`, `autofix.ts`, `lib/rules.js`), beyond surface usability.

**Flow map.** Four entry paths — Blank, Fork existing, Guided wizard, Upload JSON —
plus deep links and draft resume, all converge on one editor with one core loop:
edit → live-validate → export. That convergence is the right shape; no path dead-ends,
and nothing on the happy path is over-built. The complexity that exists concentrates
in one place: the **dual state model**.

**The dual state model is the structural root of the Pro/Simple friction.** Simple
mode edits `choices` (mood, darkness, per-token hues) and *re-derives* the whole theme
(`deriveTheme`); Pro edits the `draft` directly. The mapping is one-way — Pro edits
never flow back into `choices`. Consequences:

- Pro→Simple is not a mode switch, it's a **regeneration from stale wizard choices**
  (this is why name/tone/description reset — finding M1). Presenting Simple/Pro as a
  symmetric toggle (two adjacent buttons) misrepresents a one-way street. Either make
  the switch honest in the UI ("Rebuild in wizard…") or approximate reverse-derivation
  (seed `choices` hues from the draft's current token hues — the data is right there).
- Fork/Blank/Upload paths land in Pro with `choices` at defaults, so switching such a
  draft to Simple produces a theme unrelated to what's on screen.

**Simple mode quietly discards Palette-helper work.** Helpers apply relative to a
baseline; any wizard-choice change (including *typing in the name field*) calls
`updateChoices` → re-derives from `choices` and resets helpers to 0
(Playground.tsx:254-259). Move Warmth +30, then fix a typo in the name — the warmth
adjustment is silently gone. In Pro the same edit *keeps* helper effects (they're
baked into the new baseline). Inconsistent interplay between two adjacent control
groups in the same panel.

**"Save draft" is a mislabeled download.** The button calls `downloadRaw()` — it
downloads a JSON file (the round-trip artifact for the "Upload JSON" start card). Next
to the "Saved automatically" label, "Save draft" reads as a redundant persistence
action; its real job (export a backup/portable copy) is hidden. Rename ("Download
draft JSON") and the pairing with Upload JSON becomes legible.

- Related: the save→upload round trip **fails for drafts containing an invalid hex**
  — `downloadRaw` writes whatever is in the draft, but `validImportedTheme` rejects
  any non-`#rrggbb` token, so the file saves fine and then can't come back.

**"Finish wizard" is literally a no-op state.** Step 0 ("all sections expanded") is
the same state as never having run the wizard — finishing and skipping are
indistinguishable, which explains the missing completion moment (L5).

**What is *not* broken.** The wizard's derivation engine is genuinely good product
design: guided output is fitted against the real rule engine (`fitLightness` per
token, two passes), so Simple mode **cannot produce an invalid theme** — the neon
wheel notwithstanding, saturation is clamped to the desaturated band in `derive.ts`
(`ACCENT_SAT = 0.5`). The live validation shares the exact rule module CI runs
(`lib/rules.js` imported by both), which is the correct single-source architecture —
and precisely why the `exportEntry` omission (H4) is so ironic: the one place the
shared-rules promise breaks is the export payload itself.

**Verdict on "too complex / too broken":** the product is not over-complex — every
feature earns its place, and the four start paths map to four real user intents. Two
things are genuinely broken at the contract level: the export payload failing the
validator it advertises passing (H4, one-line fix), and green-while-dark (H3). The
rest is a legibility gap around one honest architectural tradeoff (one-way
derivation) that the UI currently hides instead of explaining.

---

## What works well (keep)

- **Preview panes sell the product.** Realistic zsh session, a `billing.ts` with an
  actual squiggle under a typo, rendered markdown in the theme's prose font, git diff
  with +/- tinting. Best-in-class versus typical swatch demos.
- **Live validation with named, human rules** ("bg is pure #ffffff (halation)"),
  correct two-tier model (hard failures block, warnings allowed at export).
- **Auto-fix is excellent**: from 8 hard failures, one click changed only 2 tokens
  minimally (e.g. `#dedede→#ededed`) and cleared everything.
- **Robust state model**: single `candela-editor-state-v1` key persisting draft, mode,
  wizard choices, and pane picker; everything restores across reloads. Simple→Pro
  carries the draft byte-identically. Cancel paths are true no-ops.
- **Clean engineering**: no console errors/warnings, no React key warnings, no 404s
  across ~10 page loads; 80 rapid slider keypresses with no lag or drift; export
  buttons use real `disabled` attributes.
- **The start-choice screen** ("How would you like to begin?") is the best novice
  moment — four clear cards, "Guided wizard" wording lands.
- **Focus states exist and are visible** (2px ring on radios and chips when tabbing).
- **Coherent identity** across home, gallery, and editor: editorial "paper workshop"
  feel, serif display + monospace micro-labels, navy primary actions.

---

## Persona verdicts

**Designer:** "A designed tool, not a bootstrap form… The signature is 'editorial paper
workshop'; the generic parts are exactly where third-party idioms leak in: native
confirm dialogs, unstyled slider anatomy, and a stock RGB color wheel that actively
argues with the brand's anti-neon manifesto. Fix the wheel first."

**Developer:** Functionally solid across all scenarios (start points, editing,
validation, auto-fix, mode switching, persistence, export gating, robustness). Top
functional bug is the id mismatch (M2); the synchronous deep-link confirm (M3) also
makes the replace flow untestable by automation.

**First-time user:** Reached a green, exportable theme unaided (7/10). The wizard happy
path works and the live preview provides the "aha". Would stall at: chip abbreviations
(H1), the one warning shown (M6), and choosing between three unexplained export
artifacts with an unfamiliar default tool (M5).

## Notes & environment caveats

- The repo docs undersell the product: `AGENTS.md` says "14 light themes" while the
  site and `themes/candela-themes.json` now ship 16 (14 light + 2 dark, `nocturne` and
  `borealis`). Worth a docs pass.
- Responsive behavior was assessed by force-applying the app's own ≤980px media rules
  (window resize was blocked by the tester's window manager): the two-column layout
  stacks cleanly. True small-viewport behavior (600px breakpoint, wheel size, sticky
  panels) remains unverified.
- Downloads were not exercised (out of scope for automated testing); button
  enable/disable gating was verified instead. Clipboard copy click succeeded; content
  verification was blocked by the browser's paste permission prompt.
- The editor was left in a healthy state: saved draft "QA Probe 1", Pro mode, "Ready
  to export".

## Suggested priority order

1. H4 — add `mode` and `tags` to `exportEntry`. One line; fixes the product's core
   contract ("green means it would ship as-is").
2. H1 — label the token chips (or preview-highlight on hover). Biggest comprehension
   win for the least effort.
3. H3 — clamp/flag the Contrast-helper dark flip; it breaks trust in the green state.
4. H2 — de-neon the Simple-mode color wheel to match the brand.
5. M1 + M3 — replace native confirms with an in-app dialog and make Pro→Simple keep
   name/tone/description (fixes UX, honesty, and e2e testability in one stroke).
   Consider reverse-deriving `choices` from the draft to make the switch truly two-way.
6. M2 — reconcile displayed id vs deep-link id.
7. M5 + M6 — plain-language layer at the export gate and in warnings.
8. Rename "Save draft" → "Download draft JSON"; give "Finish wizard" a real completion
   state pointing at export.
