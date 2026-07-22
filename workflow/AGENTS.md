# Workflow Contract: Candela Themes

The workflow plugin reads this file before `/workflow:groom`, `/workflow:work`,
and `/workflow:batch-work`. Process rules live in the plugin. Repository rules,
token roles, and theme invariants live in the root [`AGENTS.md`](../AGENTS.md).

## Project

`themes/candela-themes.json` is the source of truth for every palette, token, and
ANSI mapping. `scripts/generate.js` writes tool themes under gitignored `build/`.
The `app/` explorer reads the same JSON.

## Commands

```bash
python3 -m json.tool themes/candela-themes.json > /dev/null
node scripts/validate.js
npm run build
cd app && npm ci && npm run build
```

For visual checks, run `npm run app`. Use `/themes` to inspect gallery panes,
filters, and diagnostics. Use `/editor` to inspect editing, live validation, and
exports. Regenerate committed gallery images with `npm run app:screenshots`; see
[`docs/screenshots/README.md`](../docs/screenshots/README.md).

## Routing

| If you edit | Read first |
| --- | --- |
| `themes/candela-themes.json` | Root [`AGENTS.md`](../AGENTS.md) |
| `app/` | Root [`AGENTS.md`](../AGENTS.md) and [`README.md`](../README.md) |
| Release or packaging files | [`docs/release-runbook.md`](../docs/release-runbook.md) |
| Documentation | [`docs/style.md`](../docs/style.md) |

Record lasting decisions in [`docs/decisions.md`](../docs/decisions.md) with a
`D<N>` handle.
