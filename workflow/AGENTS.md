# Workflow Contract — Candela Themes

Read by the `workflow` plugin skills (`/workflow:groom`, `/workflow:work`, `/workflow:batch-work`) before acting. This file holds repo-specific facts only; the process lives in the plugin. Keep it short and current.

## Project

Candela is a set of 16 color themes (14 light and 2 dark) for terminals and editors, tuned for eye-strain comfort. `themes/candela-themes.json` is the single source of truth (all palettes, tokens, ANSI mapping). Tool themes (terminal, VS Code, etc.) are generated from it by `scripts/generate.js`; the `app/` explorer previews every theme live. Token roles and design invariants live in root `AGENTS.md`.

## Validation

```bash
# targeted, during implementation
python3 -m json.tool themes/candela-themes.json > /dev/null

# full gate, before every commit with non-trivial changes (run as separate steps)
python3 -m json.tool themes/candela-themes.json > /dev/null
node scripts/validate.js
```

Two automated gates: JSON validity of the source of truth (malformed JSON silently
breaks every generated theme), and `node scripts/validate.js` (Node, no deps), which
enforces the design invariants — no pure-white `bg`/`surface`, `surface` lighter than
`bg`, no pure-black `ink`, `ink`/`surface` ≥ 7:1 (AAA), every token present in all 16
themes, and ANSI mappings that reference real tokens. It exits non-zero on any hard
violation, naming the theme + token. Accent-hue count is a warn-only judgement call and
never fails the gate. Remaining visual correctness (exact hues, feel) is verified by eye
in the `.dc.html` showcase; a machine can't gate it.

Never gate a commit on a piped test run — run the check as its own step and chain the commit on its exit status.

## Verify mapping

None. No repo-local verify skills.

## Doc routing

Read the doc leaf before editing mapped paths — behavior and invariants live in docs, not code.

| If you'll edit | Read |
|---|---|
| `themes/candela-themes.json` | root `AGENTS.md` (token roles, design invariants, theme-change loop) |
| `app/` (explorer / playground) | root `AGENTS.md` + root `README.md` (explorer/playground sections) |

- Doc style rules: `docs/style.md`
- Decision log: `docs/decisions.md` with D<N> handles (used by `/workflow:decision`)

## Local notes

Design invariants that must survive any theme change (from root `AGENTS.md`): `bg`/`surface` never `#ffffff` (surface slightly lighter than bg); `ink` never `#000000` and clears ~7:1 (AAA) on `surface`; every syntax + diagnostic token and `faint` clears 4.5:1 (AA) on `bg`; `ink` on `selection` clears 4.5:1; diagnostics use unique hexes (`error`≠`num`, `warning`≠`kw`/`num`, `ok`≠`error`) with `error` vermillion / `ok` blue-green, luminance-separated; desaturation is the load-bearing anti-fringing rule (6–8 hues is taste); blue + orange carry the most meaning (colorblind-safe); every token filled in for all 16 themes — nothing implicit. Rules + rationale: `docs/vision-research.md`.

Theme explorer app lives in `app/` (Vite + React + TS, self-contained; repo root stays dependency-light). It reads the source-of-truth JSON directly. Run it with `cd app && npm install && npm run dev`; type-check/build with `npm run build`. Gallery screenshots regenerate via `cd app && npm run screenshots` (Playwright, needs `npx playwright install chromium` once) — see `docs/screenshots/README.md`. Editing the app is not gated by the theme validators above; run the app's `npm run build` to type-check app changes.
