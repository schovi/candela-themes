'use strict';

// Aurora invariant validator. Reads docs/design-handover/aurora-themes.json (the
// single source of truth) and turns the design rules from
// docs/design-handover/README.md into an automated pre-commit gate. Zero runtime
// dependencies — runs on a stock Node install. Read-only: never edits the JSON.
//
// Hard invariants fail the exit code; the accent-hue count is a judgement-call
// warning that prints but never fails.

const fs = require('fs');
const path = require('path');
const { normalizeHex, hexToRgb, relativeLuminance, contrastRatio } = require('../lib/colors');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs/design-handover/aurora-themes.json');

const AAA_CONTRAST = 7;
const WHITE = '#ffffff';
const BLACK = '#000000';
const HUE_MIN = 6;
const HUE_MAX = 8;
const SYNTAX_ACCENTS = ['kw', 'str', 'fn', 'num', 'type', 'builtin', 'punct'];

const useColor = process.stdout.isTTY;
const green = (s) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const red = (s) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);

function expectedTokens(tokenReference) {
  return [
    ...Object.keys(tokenReference.ui),
    ...Object.keys(tokenReference.syntax),
    ...Object.keys(tokenReference.diagnostics),
  ];
}

// ponytail: crude 30-degree hue bucketing at a low saturation floor. Warn-only
// heuristic for "6-8 distinct accent hues" — a judgement call, never a gate.
function distinctAccentHues(colors) {
  const buckets = new Set();
  for (const token of SYNTAX_ACCENTS) {
    let { r, g, b } = hexToRgb(colors[token]);
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const delta = max - min;
    if (delta === 0) continue;
    const lightness = (max + min) / 2;
    const saturation = delta / (1 - Math.abs(2 * lightness - 1));
    if (saturation <= 0.1) continue;
    let hue;
    if (max === r) hue = ((g - b) / delta) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue = (hue * 60 + 360) % 360;
    buckets.add(Math.round(hue / 30) % 12);
  }
  return buckets.size;
}

function checkTheme(theme, expected) {
  const failures = [];
  const warnings = [];
  const c = theme.colors || {};
  const has = (token) => typeof c[token] === 'string';

  for (const token of expected) {
    if (!has(token)) failures.push(`missing token '${token}'`);
  }

  if (has('bg') && normalizeHex(c.bg) === WHITE) failures.push('bg is pure #ffffff (halation)');
  if (has('surface') && normalizeHex(c.surface) === WHITE) failures.push('surface is pure #ffffff (halation)');
  if (has('bg') && has('surface') && relativeLuminance(c.surface) <= relativeLuminance(c.bg)) {
    failures.push(`surface ${normalizeHex(c.surface)} not lighter than bg ${normalizeHex(c.bg)}`);
  }
  if (has('ink') && normalizeHex(c.ink) === BLACK) failures.push('ink is pure #000000 (too harsh)');
  if (has('ink') && has('surface')) {
    const ratio = contrastRatio(c.ink, c.surface);
    if (ratio < AAA_CONTRAST) {
      failures.push(`ink on surface ${ratio.toFixed(2)}:1 < ${AAA_CONTRAST}:1 (WCAG AAA)`);
    }
  }

  if (SYNTAX_ACCENTS.every(has)) {
    const hues = distinctAccentHues(c);
    if (hues < HUE_MIN || hues > HUE_MAX) {
      warnings.push(`${hues} distinct accent hues, outside ${HUE_MIN}-${HUE_MAX}`);
    }
  }

  return { failures, warnings };
}

function checkAnsiMapping(ansiMapping, expected) {
  const failures = [];
  const known = new Set(expected);
  for (const group of ['normal', 'bright']) {
    const map = ansiMapping[group] || {};
    for (const [slot, token] of Object.entries(map)) {
      if (!known.has(token)) {
        failures.push(`ansiMapping.${group}.${slot} -> '${token}' is not a known token`);
      }
    }
  }
  return failures;
}

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

  for (const f of checkAnsiMapping(data.ansiMapping, expected)) {
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
