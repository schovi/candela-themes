# 010 — Theme playground: rule-guarded theme editing

done: 2026-07-17
depends: 009

## What & why

Second feature of the `app/` explorer (009): a playground where you start from scratch
or fork an existing theme and fine-tune it — colors, fonts, background — but guarded by
the design rules, so anything you export is a consistently working theme, never a free-form
mess. The rules are the ones `scripts/validate.js` enforces plus the research-backed
guidance in `docs/vision-research.md`.

## Spec

**Editing.** New playground view in `app/`. Seed = blank sensible template or any
existing theme ("fork"). Editable: every color token (color picker + hex input), code and
prose fonts (curated Google Fonts list), name, tone, description. Live preview reuses the
explorer's presentation card (same components, including the diagnostics pane).

**Rule engine — shared, not duplicated.** Extract the invariant logic used by
`scripts/validate.js` into one shared module both the Node validator and the app import
(ESM-ify `lib/colors.js`/rules or provide a dual-consumable module — implementation's
choice, but a single source of rule definitions is a hard requirement; validator behavior
must not change).

**Live feedback, always visible.** Per token: contrast ratio vs `bg`/`surface` with
pass/fail against its floor (7:1 ink, 4.5:1 syntax/diagnostics/faint — the 008 floors),
diagnostics uniqueness (`error` ≠ `num` etc.), purple/blue lightness separation, no pure
white/black. Warn-level (never blocking): accent-hue count, error/ok grayscale
separation, CVD-simulation hints.

**Gated export.** "Copy theme JSON" produces a ready-to-paste `themes[]` entry; the
button is disabled while any hard rule fails, listing exactly what's red. Warnings allowed
at export. No write-to-disk — copy-paste into `aurora-themes.json` and the standard
validate/generate loop is the integration path.

Optional (include if cheap, skip with a note otherwise): "nudge to pass" helper that
darkens/lightens a failing token to the nearest passing value while keeping hue.

Boundary — production surfaces: `app/` (playground view + shared components),
`lib/` + `scripts/validate.js` (rule extraction refactor, behavior-neutral), root
`README.md` (one paragraph on the playground).
Exclusions: no server/persistence, no editing of shipped themes in place, no new
validator rules (008 defines them), no auth/hosting.

## Acceptance criteria

- Playground can fork any of the 14 themes and start from scratch; edits update the
  preview live, in the selected fonts.
- Every hard invariant from validate.js is evaluated live in the app from the same shared
  rule module (change a rule constant once, both validator and app reflect it).
- Export is blocked while any hard rule fails and names the failures; when green, the
  copied JSON pasted into `aurora-themes.json` passes `node scripts/validate.js` without
  edits.
- `node scripts/validate.js` output on the existing 14 themes is unchanged by the
  refactor.

## Notes

Depends on 009 for the app shell and presentation components. Written assuming the
post-011 layout (`themes/aurora-themes.json`); if 011 hasn't shipped, the only delta is
the JSON path. The "not completely free edit" requirement is satisfied by gated export +
omnipresent feedback, not by clamped inputs (decided in groom).

Shared rules live in `lib/rules.js` (ESM), imported by both `scripts/validate.js`
(Node 22 `require(ESM)`) and the app. Hard gate = the invariants `validate.js` enforces
today. The spec's extra warn-level checks (4.5:1 syntax/diagnostics floors,
diagnostics-uniqueness, purple/blue separation, CVD hints) are 008's floors; 008 had not
landed them in `validate.js` when this shipped, so they are not implemented here — once
008 adds them to `lib/rules.js` the playground picks them up automatically. Per-token
contrast vs bg/surface is shown as info in the feedback pane.
