// The single source for every human-read description of Candela: marketplace
// listings, install manuals, the candela.ink meta tags, and the GitHub repo
// description. Three lengths, because the surfaces have different limits — a
// surface picks the variant that fits rather than getting the long one and
// truncating it. Zero dependencies; ESM (see lib/package.json).
//
// Consumers: lib/emitters.js (all generated packages), app/src/branding.ts
// (site), scripts/validate.js (length + drift gate). The static <meta> tags in
// app/*.html cannot import JS, so validate.js string-compares them instead.
//
// Two rules the gate enforces, both learned the hard way:
//   - No theme counts in copy. Adding a theme must never mean editing marketing
//     text. Say "a family", "light schemes and dark companions".
//   - Mode-neutral voice. Candela ships dark companions, so no tagline or page
//     title may claim it is a light-only theme set.

// Brand line: the site H1 and the OG title suffix. Evocative, not descriptive —
// it never has to stand alone as a store listing.
export const TAGLINE = 'Color, measured for tired eyes.';

// The store one-liner: search results, the JetBrains card, Zed's extension list,
// the GitHub repo description. Front-loaded and complete on its own.
export const SUMMARY =
  'Color themes for editors and terminals, tuned for long sessions and tired eyes.';

// The long form: VS Code's package.json description, bundled READMEs, the
// JetBrains detail page. Only for surfaces with room — the fix for the JetBrains
// card, which used to cut this mid-clause at "...desaturated accents," around
// character 102, is that the card now gets SUMMARY instead.
//
// It still opens with SUMMARY verbatim (validate.js enforces it) so a surface we
// haven't audited degrades gracefully: it shows a complete sentence first, then a
// truncated remainder, rather than losing the pitch to a mid-clause cut.
export const DESCRIPTION =
  SUMMARY +
  ' Low-glare backgrounds, desaturated accents, and WCAG-AA contrast throughout, ' +
  'with the same palette everywhere you work.';

// Sublime Text reserves "theme" for UI themes, so calling a syntax palette a
// theme there is actively misleading — Package Control review asked us to keep
// the word out of the package's README title and repo description
// (sublimehq/package_control_channel#9493). Sublime-facing surfaces get this
// instead of DESCRIPTION; every other surface keeps the shared wording.
export const SUBLIME_DESCRIPTION =
  'Color schemes for Sublime Text and your terminal, tuned for long sessions and tired eyes. ' +
  'Low-glare backgrounds, desaturated accents, and WCAG-AA contrast throughout, ' +
  'with the same palette everywhere you work.';

// The theme playground on the site, pitched to the reader who likes one palette
// but not one of its colors. Long-form surfaces only (bundled READMEs, the
// JetBrains detail page): it carries a URL, which renders as dead plain text in
// SUMMARY/DESCRIPTION surfaces like VS Code's search result and the GitHub repo
// description, and burns characters against their caps for nothing.
//
// Says "palette", never "theme". Sublime reserves "theme" for UI themes (see
// SUBLIME_DESCRIPTION), so the neutral noun keeps this as one string instead of
// two that can drift. The link text and href are separate because Markdown and
// the plugin.xml HTML compose them differently — see lib/emitters.js.
//
// "keep the same contrast rules" is a load-bearing claim, not a flourish: the
// editor runs the same lib/rules.js invariants live and gates its export on
// them, so a customized palette still clears the floors people installed Candela
// for. Do not reword it into a generic "customize it" pitch.
export const EDITOR_URL = 'https://candela.ink/editor';
export const EDITOR_LINK_TEXT = 'candela.ink/editor';
export const CUSTOMIZE =
  'Build your own in the browser: adjust any palette, keep the same contrast rules, ' +
  'export it for your editor';

export const WHY_CANDELA = [
  ['Built for tired eyes', 'low-glare backgrounds (never pure white or black) and desaturated accents that resist visual fringing.'],
  ['Readable by design', 'every syntax and UI color clears WCAG-AA contrast; primary text clears AAA.'],
  ['One palette everywhere', 'the same colors in your editor and your terminal.'],
  ['A whole family', 'light schemes for every room, plus dark companions, all from one coordinated, curated set.'],
];

// Page titles. Kept here so the mode-neutral rule has one place to be checked,
// even though app/*.html hard-codes the strings.
export const SITE_TITLE = 'Candela — Themes for Tired Eyes';

// Observed caps, tightest first. Each cites where the number comes from; none is
// a guess at an undocumented API limit.
export const CAPS = {
  // JetBrains Marketplace plugin *card* truncated the old 190-char description
  // at character 102 (task 045). 100 is that observation, rounded down.
  SUMMARY: 100,
  // GitHub's repo description field is a hard 350 characters.
  DESCRIPTION: 350,
  // No external cap; a brand line longer than this stops working as one.
  TAGLINE: 60,
};

// Marketing copy must not hard-code how many themes ship.
export const THEME_COUNT_PATTERN = /\b\d+\s+(?:light|dark|theme)/i;
