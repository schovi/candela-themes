# 067 — Publish Candela to the Obsidian community directory

gate: a Candela GitHub Release containing the Obsidian package exists

tags: packaging

## What & why

Make Candela installable from Obsidian's community theme browser. The browser needs a
public, standalone theme repository and a matching release before the directory can
list it. This stays separate from the emitter so a registry review never blocks theme
generation.

## Spec

Create `schovi/candela-themes-obsidian`, following the existing dedicated distribution
repository naming. Publish the generated `Candela/` contents at its root with the
matching manifest version, README, license, and a GitHub Release tagged to that version.

Submit an upstream PR to `obsidianmd/obsidian-releases` adding Candela to
`community-css-themes.json`. Use the public repository as the entry's source, meet the
current submission rules, and leave the PR open for Obsidian's review.

Owns the new distribution repository and the upstream directory submission. Excludes
automating later Obsidian distribution-repository updates, which can follow once the
first listing is accepted. Read `docs/release-runbook.md` and the current Obsidian
theme-submission guidance before acting.

## Acceptance criteria

- A public `schovi/candela-themes-obsidian` repository contains a root-level, installable
  Candela theme matching the released Candela version.
- A GitHub Release with the matching version makes the theme files available to Obsidian.
- An `obsidianmd/obsidian-releases` pull request adds Candela to the community theme
  directory and passes its automated checks.
- The source release, distribution repository, and directory PR URLs are recorded in the
  task Notes.

## Notes

- Obsidian's directory reads public theme metadata from GitHub, and its current directory
  remains `obsidianmd/obsidian-releases`.
