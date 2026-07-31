'use strict';

// Candela invariant validator. Reads themes/candela-themes.json (the
// single source of truth) and turns the design rules from
// AGENTS.md ("Design rules to preserve") into an automated pre-commit gate. Zero runtime
// dependencies — runs on a stock Node install. Read-only: never edits the JSON.
//
// Also gates the listing copy in lib/copy.js: length caps per surface, the
// no-theme-counts rule, the mode-neutral rule, and drift between the module and
// the static <meta> tags it can't reach.
//
// Hard invariants fail the exit code; the accent-hue count is a judgement-call
// warning that prints but never fails.

const fs = require('fs');
const path = require('path');
const { expectedTokens, checkTheme, checkAnsiMapping, checkPairs } = require('../lib/rules');
const copy = require('../lib/copy.js');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'themes/candela-themes.json');

// Files whose human-read copy must stay count-free and mode-neutral. Excludes
// docs/marketplace-listing.md, which quotes "14 light, 2 dark" as the example of
// what not to write. The .tsx files are here because the site footer once
// hard-coded its own light-only tagline where an HTML-only scan couldn't see it.
const COPY_FILES = [
  'README.md',
  'app/index.html',
  'app/themes.html',
  'app/editor.html',
  'app/src/Home.tsx',
  'app/src/SiteShell.tsx',
  // The sample README pane is rendered into every committed screenshot and every
  // gallery card, so its prose is marketplace copy — it shipped "Candela Light"
  // onto the JetBrains listing, on the dark themes included.
  'app/src/samples/Panes.tsx',
];

// The tagline's signature phrase. Any app source spelling it out is a second copy
// of the brand line that lib/copy.js can no longer govern — import TAGLINE
// instead. Scoped to app sources: README legitimately carries TAGLINE verbatim.
const TAGLINE_PHRASE = /for tired eyes/i;
const TAGLINE_SCANNED = ['app/src/Home.tsx', 'app/src/SiteShell.tsx'];

const readCopyFile = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');

// Comments are not copy a user ever reads, and counting them defeats the checks
// below — a `{/* ...dark... */}` note was enough to mask a light-only claim in the
// prose beside it. Block comments only; stripping `//` would eat URLs.
const withoutComments = (text) =>
  text.replace(/\{\/\*[\s\S]*?\*\/\}/g, '').replace(/\/\*[\s\S]*?\*\//g, '').replace(/<!--[\s\S]*?-->/g, '');

// Pull one attribute value out of the static HTML. Deliberately not a parser:
// these are three hand-written lines in a file we control.
function htmlMeta(html, pattern) {
  const match = html.match(pattern);
  return match ? match[1] : null;
}

// Every copy invariant, as failure strings. Empty array = clean.
function checkCopy() {
  const failures = [];

  for (const [name, cap] of Object.entries(copy.CAPS)) {
    const value = copy[name];
    if (value.length > cap) {
      failures.push(`copy: ${name} is ${value.length} chars, over its ${cap}-char cap`);
    }
  }

  // A truncating surface must cut after a whole sentence, not mid-clause. Holds
  // as long as the long form opens with the short one verbatim.
  if (!copy.DESCRIPTION.startsWith(copy.SUMMARY)) {
    failures.push('copy: DESCRIPTION must start with SUMMARY so truncation lands after a full sentence');
  }

  for (const name of ['TAGLINE', 'SUMMARY', 'DESCRIPTION', 'CUSTOMIZE']) {
    if (copy.THEME_COUNT_PATTERN.test(copy[name])) {
      failures.push(`copy: ${name} hard-codes a theme count — say "a family", not a number`);
    }
    if (/\blight\b/i.test(copy[name]) && !/\bdark\b/i.test(copy[name])) {
      failures.push(`copy: ${name} names light without dark — Candela is not a light-only set`);
    }
  }

  for (const rel of COPY_FILES) {
    const text = withoutComments(readCopyFile(rel));
    const counts = text.match(new RegExp(copy.THEME_COUNT_PATTERN.source, 'gi')) || [];
    for (const hit of new Set(counts)) {
      failures.push(`copy: ${rel} hard-codes a theme count ("${hit.trim()}")`);
    }
    // File-level mode balance, the same rule the copy.js strings get: a surface
    // that describes Candela as "light" must also name the dark companions, or
    // it is a light-only claim. Catches prose no title/count regex can see.
    if (/\blight\b/i.test(text) && !/\bdark\b/i.test(text)) {
      failures.push(`copy: ${rel} describes Candela as light without naming dark`);
    }
    // Page titles are the loudest place a light-only claim hides.
    const titles = [
      ...text.matchAll(/<title>([^<]*)<\/title>/gi),
      ...text.matchAll(/<meta property="og:title" content="([^"]*)"/gi),
    ].map(([, value]) => value);
    for (const title of titles) {
      if (/\blight\b/i.test(title)) {
        failures.push(`copy: ${rel} title claims a light-only set ("${title}")`);
      }
    }
  }

  // The home page and the README hard-code what lib/copy.js exports (neither can
  // import it); keep them identical.
  const home = readCopyFile('app/index.html');
  const mirrored = [
    [htmlMeta(home, /<title>([^<]*)<\/title>/), copy.SITE_TITLE, 'app/index.html <title>'],
    [htmlMeta(home, /<meta name="description" content="([^"]*)"/), copy.DESCRIPTION, 'app/index.html meta description'],
    [htmlMeta(home, /<meta property="og:description" content="([^"]*)"/), copy.SUMMARY, 'app/index.html og:description'],
  ];
  for (const [got, want, label] of mirrored) {
    if (got !== want) failures.push(`copy: ${label} has drifted from lib/copy.js`);
  }
  if (!readCopyFile('README.md').includes(copy.TAGLINE)) {
    failures.push('copy: README.md no longer carries the TAGLINE from lib/copy.js');
  }
  for (const rel of TAGLINE_SCANNED) {
    if (TAGLINE_PHRASE.test(readCopyFile(rel))) {
      failures.push(`copy: ${rel} spells out the tagline — import TAGLINE from lib/copy.js instead`);
    }
  }

  return failures;
}

// Generated store listings embed every screenshot by absolute raw.githubusercontent
// URL, so a missing or misnamed file is a broken image on the VS Code / Open VSX page
// that nothing local would notice — the listing renders fine, it just shows nothing.
// The filename encodes theme order, so reordering themes silently invalidates it too.
// The hand-captured full-window shots the Sublime readme embeds are checked too: those
// are re-shot by hand, so a rename is exactly the kind of thing that slips through.
const EMBEDDED_SHOTS = [
  'docs/screenshots/sublime/sublime-light.png',
  'docs/screenshots/sublime/sublime-dark.png',
  'docs/screenshots/zed/zed-light.png',
  'docs/screenshots/zed/zed-dark.png',
  'docs/screenshots/vscode/vscode-light.png',
  'docs/screenshots/vscode/vscode-dark.png',
];
function checkScreenshots(themes) {
  const missing = (file) =>
    fs.existsSync(path.join(ROOT, file))
      ? []
      : [`screenshot: ${file} is missing — regenerate (see docs/screenshots/README.md)`];
  return [
    ...themes.flatMap((theme) => missing(`docs/screenshots/examples/candela-${theme.id}.png`)),
    ...EMBEDDED_SHOTS.flatMap(missing),
  ];
}

const useColor = process.stdout.isTTY;
const green = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);

function main() {
  const data = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const expected = expectedTokens(data.tokenReference);

  let hardFailures = 0;
  let warningCount = 0;

  for (const theme of data.themes) {
    const { failures, warnings } = checkTheme(theme, expected);
    for (const f of failures) {
      console.log(`${red('FAIL')}  ${theme.id}: ${f}`);
      hardFailures++;
    }
    for (const w of warnings) {
      console.log(`warn  ${theme.id}: ${w}`);
      warningCount++;
    }
  }

  for (const f of checkPairs(data.themes)) {
    console.log(`${red('FAIL')}  ${f}`);
    hardFailures++;
  }

  for (const f of checkAnsiMapping(data.ansiMapping, expected)) {
    console.log(`${red('FAIL')}  ${f}`);
    hardFailures++;
  }

  for (const f of checkCopy()) {
    console.log(`${red('FAIL')}  ${f}`);
    hardFailures++;
  }

  for (const f of checkScreenshots(data.themes)) {
    console.log(`${red('FAIL')}  ${f}`);
    hardFailures++;
  }

  const warnSuffix = warningCount ? ` (${warningCount} warning(s))` : '';
  if (hardFailures) {
    console.log(`\n${red(`${hardFailures} invariant failure(s)`)} across ${data.themes.length} themes${warnSuffix}.`);
    process.exit(1);
  }
  console.log(green(`OK  ${data.themes.length} themes pass all invariants${warnSuffix}.`));
}

main();
