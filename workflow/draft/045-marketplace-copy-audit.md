# 045 — Audit and polish copy across all marketplaces and visible surfaces

priority: 50

## What & why

Copy is currently scattered and was written piecemeal. One shared `DESCRIPTION`
constant now feeds the VS Code, IntelliJ, Zed, and VS Code README surfaces (commit
a95ff5d), but nothing has been reviewed end to end for tone, length limits, and
truncation behaviour per store. Example seen in the wild: the JetBrains embeddable
plugin *card* truncates the description mid-sentence ("...desaturated accents,") —
harmless on the detail page, but a sign no one has checked how each surface renders
the copy.

Do one deliberate pass over every place a human reads Candela marketing/description
copy, validate it against each surface's real constraints, and polish.

## Surfaces to cover (non-exhaustive — confirm at groom)

- **VS Code Marketplace**: `displayName`, `description`, README body, keywords, gallery banner.
- **Open VSX**: same package.json + README (shares the `.vsix`).
- **JetBrains Marketplace**: `plugin.xml` `<description>`, `<change-notes>`, the web
  listing short description + overview, and how the **card widget** truncates (front-load
  the sentence so the truncated form still reads well).
- **Zed**: `extension.toml` `description` (one line, front-loaded).
- **Sublime / Package Control**: listing description on the channel PR.
- **Terminal bundles / nvim / helix**: per-tool install READMEs (`lib/emitters.js` manuals).
- **GitHub**: repo description/topics, release notes template, README H1 + tagline.
- **candela.ink** (`app/`): Home hero, gallery, editor page copy, meta/OG tags.

## Open questions for groom

- Single source vs per-surface variants: `DESCRIPTION` is one string today. Some
  surfaces want shorter (Zed one-liner, JetBrains card) or longer (marketplace overview).
  Decide whether to add a couple of length variants (short/tagline/paragraph) as constants
  or keep one and accept truncation.
- Whose voice/tone is canonical — align with the `branding.ts` tagline and docs style
  (`docs/style.md`).
- Is there a length/truncation check worth automating, or is this a one-time human pass?

## Notes

- Source of truth for the generated-package copy is `lib/emitters.js` (`DESCRIPTION`
  constant + per-format manuals). candela.ink copy lives in `app/`.
- Not urgent; purely polish. No functional impact.
