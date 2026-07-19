# 036 — Validation clarity and export guidance

done: 2026-07-19

## What & why

Validation output is expert-speak ("error/ok grayscale separation 1.01 < 1.3") with no
hint which control fixes it, the contrast table is raw data, and the export gate offers
three unexplained artifacts (EDITOR-REVIEW.md M5, M6, L6, L7). Make every message
actionable by a novice without dumbing down the data.

## Spec

- **Plain-language layer over rule messages.** In the app (not `lib/rules.js` — shared
  with CI), map each failure/warning pattern to a one-sentence translation naming the
  control to touch, e.g. grayscale separation → "Your error red and success green look
  too similar in grayscale — lighten or darken one of them (Diagnostics)." Technical
  message stays as a secondary line. Unmapped messages fall through verbatim.
- **Contrast table redesign (content).** Drop rows for tokens with no contrast floor
  (bg, surface, border, selection, cursor, lineHighlight — the self/no-op rows), add
  the required floor and a pass/fail glyph per cell. Keep it a plain table; visual
  polish belongs to 040.
- **Export gate explains itself (M5).** Per-tool one-liner under the Target tool select;
  button labels self-describe ("Download for iTerm2" / "Download all formats"); an
  "Install instructions →" link to the README's install section (verify the public
  site's equivalent anchor — use whatever the deployed site exposes).
- **Blocked status is a shortcut (L7).** Clicking "Export blocked · N hard failures"
  opens the validation panel and scrolls to it.

Boundary: `app/src/Playground.tsx`, `app/src/ExportControls.tsx`,
`app/src/styles.css` (minimal). Excluded: `lib/rules.js` message changes, pass-state
visual celebration (040), colorblind "see it" hook (038 wires into this layer).

## Acceptance criteria

- Every hard failure and warning producible in the editor shows a plain sentence that
  names the control group to adjust; the technical detail remains visible.
- Contrast table contains no identity/no-floor rows and shows floor + pass/fail per
  entry.
- Each export button/dropdown choice communicates what you get for which tool; an
  install-instructions link is present and resolves.
- Clicking the blocked-status line reveals the failing list without manual scrolling.
- `npm run build` (app) type-checks clean.
