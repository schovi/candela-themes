# Contributing to Candela Themes

Thanks for helping. This guide is the source of truth for local setup, which files
you edit, how to validate, and what a pull request needs. The [`README`](../README.md)
covers what the themes are and how to install them; [`AGENTS.md`](../AGENTS.md) covers
the token roles and the design invariants to preserve.

## Authored vs generated

Colors are authored in exactly one place: [`themes/candela-themes.json`](../themes/candela-themes.json)
(palettes, tokens, ANSI mapping). Everything under `build/` (per-tool theme files) and
`dist/` (packaged artifacts) is **generated** — never hand-edit it, and never commit it.
Both directories are gitignored. If a change only shows up in `build/`, it belongs in the
JSON or in `lib/emitters.js`, not in the generated output.

## Setup

The generator has no runtime dependencies. Packaging and the explorer do:

```sh
npm ci                 # packaging tooling (root)
cd app && npm ci       # the explorer, when you touch app/
```

The IntelliJ package additionally needs a JDK (17+) and Gradle (9+); the explorer's
screenshots need Playwright's Chromium (`cd app && npx playwright install chromium`).

## Making a change

Editing themes:

1. Edit `themes/candela-themes.json`.
2. `python3 -m json.tool themes/candela-themes.json > /dev/null` — JSON validity.
3. `node scripts/validate.js` — hard-gates the design invariants; exits non-zero naming
   the failing theme and token.
4. `npm run build` — wipes and rewrites `build/` deterministically.
5. Eyeball the explorer (`npm run app`, routes `/`, `/themes`, `/editor`) — validation
   can't judge hue or feel.

Adding a theme or a tool format, and the full invariant list, are documented in
[`AGENTS.md`](../AGENTS.md). Read it before adding or tweaking a theme.

## Screenshots

Gallery PNGs are committed. Regenerate them only when the visual output changed:

```sh
npm run app:screenshots
```

See [`docs/screenshots/README.md`](../docs/screenshots/README.md).

## Pull requests

- Commit the source JSON (and any `lib/`/`app/`/docs changes). Do **not** commit `build/`
  or `dist/`.
- `python3 -m json.tool themes/candela-themes.json > /dev/null`, `node scripts/validate.js`,
  and `npm run build` all pass. CI runs the same checks (`validate-and-build`) and must be
  green before merge.
- Keep the change focused; link any related issue.
- `main` is protected: land changes through a pull request with conversations resolved.

## Reporting problems

Bugs and requests go through the issue templates. Security issues go through GitHub's
private vulnerability reporting, not public issues — see [`SECURITY.md`](SECURITY.md).
