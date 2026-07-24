<!-- What & why (one line): -->

Checklist:

- [ ] Edited `themes/candela-themes.json` (the source of truth), not generated `build/`
- [ ] Ran `python3 -m json.tool themes/candela-themes.json > /dev/null` (JSON valid)
- [ ] Ran `node scripts/validate.js` (design invariants pass)
- [ ] Ran `npm run build`
- [ ] Eyeballed the explorer for visual changes
- [ ] Did NOT commit `build/` or `dist/` (both gitignored)
- [ ] Linked any related issue

See [CONTRIBUTING.md](CONTRIBUTING.md) for details.
