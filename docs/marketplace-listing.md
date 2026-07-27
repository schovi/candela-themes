# Marketplace listing template

How to fill a store listing for Candela. The wording itself is **not** here — it
lives in [`lib/copy.js`](../lib/copy.js), the single source for every marketplace
listing, install manual, `candela.ink` meta tag, and the GitHub repo description.
`scripts/validate.js` gates that module, so anything duplicated in this doc would
drift silently. Only the install steps differ per tool.

**Rules** (all three enforced by `node scripts/validate.js`)

- No theme counts anywhere ("14 light, 2 dark"). Adding a theme must never mean
  editing marketing copy. Say "a family", "light schemes and dark companions".
- Mode-neutral voice. Candela ships dark companions, so no tagline or page title
  may present it as a light-only theme set.
- Same short description and same "Why Candela" block in every listing, taken
  from `lib/copy.js`.

---

## Which variant goes where

`lib/copy.js` exports three lengths so a constrained surface gets a line that
fits instead of a truncated long one. `DESCRIPTION` opens with `SUMMARY` verbatim,
so even a surface that cuts mid-string cuts after a whole sentence.

| Export | Cap | Where it goes | Cap comes from |
| --- | --- | --- | --- |
| `TAGLINE` | 60 | `candela.ink` H1, README tagline | no external limit; longer stops working as a brand line |
| `SUMMARY` | 100 | Zed `extension.toml`, JetBrains card, GitHub repo description, `og:description` | JetBrains card truncated the old 190-char description at char 102 (task 045) |
| `DESCRIPTION` | 350 | VS Code `package.json`, bundled READMEs, JetBrains detail page, `<meta name="description">` | GitHub's repo description field is a hard 350 |

---

## Nothing here is pasted by hand

Every store reads its copy from the packaged artifact, so a copy change reaches all
of them through a normal release — never through a web form. See
[`release-runbook.md`](release-runbook.md).

| Store | Copy comes from | Reaches the store via |
| --- | --- | --- |
| VS Code, Open VSX | `build/vscode/package.json` + `README.md` | the `.vsix`, `Publish` |
| JetBrains | `plugin.xml` `<description>` (HTML, not Markdown) | plugin upload, `Publish` |
| Zed | `build/zed/extension.toml` `description` | `candela-themes-zed` dist repo + version-bump PR |
| Sublime / Package Control | `build/sublime/README.md` | tags on the `candela-themes-sublime` dist repo |
| Neovim, Helix, terminals | `build/nvim/README.md` and friends | GitHub Releases |

The Package Control channel entry points at the dist repo with `"tags": true`; it
holds no description of its own.

To read a variant out for the rare hand-typed spot (the GitHub repo description, a
social post), print it rather than retyping:

```sh
node -p "require('./lib/copy.js').SUMMARY"
node -p "require('./lib/copy.js').DESCRIPTION"
```

---

## Screenshots

Committed images live in `docs/screenshots/examples/candela-<NN>-<id>.png`, one per
theme, where `NN` is the 1-based theme order. Regenerate with
`cd app && npm run screenshots -- --out=docs/screenshots/examples`
(see [`screenshots/README.md`](screenshots/README.md)). The generated READMEs
reference them by **absolute GitHub URL** so every marketplace renders the same set:

```
https://github.com/schovi/candela-themes/raw/main/docs/screenshots/examples/candela-<NN>-<id>.png
```

`lib/emitters.js` derives both the number and the caption from the themes array, so
there is no hand-maintained pick list: the hero is `sepia-paper` and the gallery is
**every theme, in source order**. A listing is where someone chooses a theme, and an
unshown theme is an uninstalled theme. Remote images cost the package nothing.

`scripts/validate.js` fails if any theme lacks its expected file, so a reorder or a
new theme can't ship a 404 into a store listing again.

JetBrains is the exception: its listing screenshots are uploaded through the plugin's
web edit form, not read from `plugin.xml`. Upload the same PNGs by hand once.

---

## Per-marketplace notes

- **VS Code / Open VSX** — description is the bundled `README.md`
  (`lib/emitters.js` → `vscodeReadme()`); the short field is `package.json`
  `description`, which carries `DESCRIPTION`. Markdown + remote images render.
- **JetBrains** — `plugin.xml` `<description>` (CDATA, HTML not Markdown) carries
  `DESCRIPTION`; the web form's short description takes `SUMMARY`, which is what
  the card widget shows.
- **Sublime / Neovim** — plain README in the archive; keep the install block. Both
  carry the same full gallery; drop it only if a host won't render remote images.
- **Zed / GitHub** — full Markdown renders. Zed's `description` field is one line,
  so it takes `SUMMARY`.
