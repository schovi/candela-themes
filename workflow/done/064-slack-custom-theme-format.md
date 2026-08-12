# 064 — Slack custom theme format

done: 2026-08-12

tags: emitters, packaging

## What & why

Slack's current custom theme is four hex colors pasted into Preferences → Appearance →
Custom theme → Import. That is the whole format — no syntax tokens, no file, just a
share string. It costs almost nothing to emit and it puts Candela on the app people
stare at next to their editor all day.

Confirmed from the user's own Slack (July 2026): the form has four fields — **System
navigation**, **Selected items**, **Presence indication**, **Notifications** — plus two
toggles, *Window gradient* and *Darker sidebars*. The share/import string is
comma-separated, e.g. `#5E5D60,#FFEDE5,#4CC894,#73BDF3`. Slack's Import dialog also
accepts the legacy 8-colour string behind a "Paste your legacy theme colors" link.

## Spec

New emitter `emitSlackTheme` in `lib/emitters/` (its own module), one file per theme:
`build/slack/candela-<id>.txt`, containing the theme name, the four-colour string, and
the two toggle recommendations.

Token map (chrome-only palette; there is nothing syntax-shaped to map):

| Slack slot | Light themes | Dark themes |
| --- | --- | --- |
| System navigation | `ink2` | `surface` |
| Selected items | `selection` | `selection` |
| Presence indication | `ok` | `ok` |
| Notifications | `error` | `error` |

Toggles to recommend in the emitted file: *Darker sidebars* on for light themes (System
navigation is a dark ink, so the sidebar must go dark to stay readable) and off for
dark themes; *Window gradient* off, so the palette reads flat and exact.

**Verify at implementation time, in Slack:** the field order inside the share string.
The user's sample form shows Notifications `#FBB895` while their share string's fourth
value is `#73BDF3`, so form order and string order may differ. Round-trip a known
string — paste `#111111,#222222,#333333,#444444` into Import and read which field each
lands in — then emit in that order. This is a lookup, not a design decision; it does not
change anything else in the spec.

Packaging: drop-in, so a `bundles[]` entry in `scripts/package-bundles.js`
(`tool: 'slack'`, `extension: '.txt'`).

**Implementation boundary**
- Owns: `lib/emitters/` (new module + `FORMAT_EMITTERS`/`INSTALL_STEPS` entries in `index.js`),
  `scripts/generate.js` (the `FORMAT_EMITTERS.length` assert + a log line), `scripts/package-bundles.js`,
  `app/src/ExportControls.tsx`, `README.md` (a `### Slack` section under `## Install`).
- Excluded: the legacy 8-colour string — emit the current 4-colour form only.
- Excluded: any per-theme validation rule. `lib/rules.js` gates editor/terminal
  contrast; Slack chrome is outside those invariants and must not gain a gate.
- Note: `ink2` as System navigation on a light theme is a judgement call, not a derived
  value. Eyeball two or three light themes in Slack and swap the token if the sidebar
  reads muddy.

## Acceptance criteria

- `npm run build` writes 26 `build/slack/candela-<id>.txt` files, each with a four-hex comma-separated string.
- Pasting a light theme's string and a dark theme's string into Slack → Preferences → Appearance → Custom theme → Import applies the intended colors to the right four slots.
- Each file names the theme and states the *Darker sidebars* / *Window gradient* settings to use.
- `npm run package:bundles` writes `dist/candela-themes-slack-<version>.tar.gz` with 26 `.txt` files plus `README.txt`.
- The explorer's `/editor` Export picker offers Slack and its zip installs cleanly.
- README documents the paste-in install under `## Install`.
- Green: `node scripts/validate.js`, `npm run build`, `cd app && npm ci && npm run build`.
