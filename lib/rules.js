// Candela design invariants, in one place. The single source of the rule
// definitions from AGENTS.md ("Design rules to preserve").
// Consumed by two callers that must never diverge:
//   - scripts/validate.js  (Node pre-commit gate, adds fs + colored output)
//   - app/ theme playground (live feedback + gated export)
// Change a constant here and both reflect it. Pure and dependency-free apart
// from the hex helpers; never reads files or prints. ESM (see lib/package.json).

import { normalizeHex, hexToRgb, hexToHsl, relativeLuminance, contrastRatio } from './colors.js';

export const AAA_CONTRAST = 7;
export const AA_CONTRAST = 4.5;
export const WHITE = '#ffffff';
export const BLACK = '#000000';
export const HUE_MIN = 6;
export const HUE_MAX = 8;
export const MODES = ['light', 'dark'];
export const SYNTAX_ACCENTS = ['kw', 'str', 'fn', 'num', 'type', 'builtin', 'punct'];
export const DIAGNOSTICS = ['error', 'warning', 'ok'];
// Tokens that render as informational text and must clear WCAG AA against bg
// (bg is the binding surface — terminals paint on it; surface is lighter). See
// docs/vision-research.md.
export const AA_TOKENS = [...SYNTAX_ACCENTS, ...DIAGNOSTICS, 'faint'];

// Warn-only judgement thresholds (like the accent-hue count): tuned so the
// shipped palettes pass with margin, firing only on a real regression.
const GRAY_SEP_WARN = 1.3; // error vs ok luminance contrast (grayscale legibility)
const CVD_DIST_WARN = 34; // sRGB distance between error and ok after protan/deutan sim

// Cheap Viénot-1999-style protanopia / deuteranopia simulation in sRGB space
// (gamma ignored — enough for a "are these two tokens still distinct?" warn).
const CVD_MATRICES = {
  protan: [[0.11238, 0.88762, 0], [0.11238, 0.88762, 0], [0.00401, -0.00401, 1]],
  deutan: [[0.29275, 0.70725, 0], [0.29275, 0.70725, 0], [-0.02234, 0.02234, 1]],
};
function cvdDistance(hexA, hexB) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  let min = Infinity;
  for (const m of Object.values(CVD_MATRICES)) {
    const pa = m.map((row) => row[0] * a.r + row[1] * a.g + row[2] * a.b);
    const pb = m.map((row) => row[0] * b.r + row[1] * b.g + row[2] * b.b);
    const d = Math.hypot(pa[0] - pb[0], pa[1] - pb[1], pa[2] - pb[2]);
    if (d < min) min = d;
  }
  return min;
}

export function expectedTokens(tokenReference) {
  return [
    ...Object.keys(tokenReference.ui),
    ...Object.keys(tokenReference.syntax),
    ...Object.keys(tokenReference.diagnostics),
  ];
}

// ponytail: crude 30-degree hue bucketing at a low saturation floor. Warn-only
// heuristic for "6-8 distinct accent hues" — a judgement call, never a gate.
export function distinctAccentHues(colors) {
  const buckets = new Set();
  for (const token of SYNTAX_ACCENTS) {
    const { h, s } = hexToHsl(colors[token]);
    if (s <= 0.1) continue;
    buckets.add(Math.round(h / 30) % 12);
  }
  return buckets.size;
}

export function checkTheme(theme, expected) {
  const failures = [];
  const warnings = [];
  const c = theme.colors || {};
  const has = (token) => typeof c[token] === 'string';

  for (const token of expected) {
    if (!has(token)) failures.push(`missing token '${token}'`);
  }

  if (!MODES.includes(theme.mode)) {
    failures.push(`mode ${JSON.stringify(theme.mode)} is not one of ${MODES.join('/')}`);
  }

  if (has('bg') && MODES.includes(theme.mode)) {
    const lightness = hexToHsl(c.bg).l;
    if (theme.mode === 'light' && lightness <= 0.5) {
      failures.push(`mode light requires bg lightness > 0.5 (got ${lightness.toFixed(2)})`);
    }
    if (theme.mode === 'dark' && lightness >= 0.5) {
      failures.push(`mode dark requires bg lightness < 0.5 (got ${lightness.toFixed(2)})`);
    }
  }

  if (!Array.isArray(theme.tags) || theme.tags.length === 0 ||
      !theme.tags.every((tag) => typeof tag === 'string' && tag.length > 0)) {
    failures.push('tags must be a non-empty array of strings');
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

  // Every informational token clears WCAG AA against bg (the binding surface).
  if (has('bg')) {
    for (const token of AA_TOKENS) {
      if (!has(token)) continue;
      const ratio = contrastRatio(c[token], c.bg);
      if (ratio < AA_CONTRAST) {
        failures.push(`${token} on bg ${ratio.toFixed(2)}:1 < ${AA_CONTRAST}:1 (WCAG AA)`);
      }
    }
  }

  // Text stays readable on the selection background.
  if (has('ink') && has('selection')) {
    const ratio = contrastRatio(c.ink, c.selection);
    if (ratio < AA_CONTRAST) {
      failures.push(`ink on selection ${ratio.toFixed(2)}:1 < ${AA_CONTRAST}:1 (WCAG AA)`);
    }
  }

  // Diagnostics must be distinguishable from the syntax tokens they sit beside.
  const distinct = (a, b, label) => {
    if (has(a) && has(b) && normalizeHex(c[a]) === normalizeHex(c[b])) {
      failures.push(`${label}: ${a} and ${b} share ${normalizeHex(c[a])}`);
    }
  };
  distinct('error', 'num', 'diagnostic collision');
  distinct('warning', 'kw', 'diagnostic collision');
  distinct('warning', 'num', 'diagnostic collision');
  distinct('ok', 'error', 'diagnostic collision');

  // Warn-only: red/green diagnostics should read apart in grayscale and survive
  // protan/deutan simulation (judgement calls, never gate — see docs/vision-research.md).
  if (has('error') && has('ok')) {
    const gray = contrastRatio(c.error, c.ok);
    if (gray < GRAY_SEP_WARN) {
      warnings.push(`error/ok grayscale separation ${gray.toFixed(2)} < ${GRAY_SEP_WARN}`);
    }
    const cvd = cvdDistance(c.error, c.ok);
    if (cvd < CVD_DIST_WARN) {
      warnings.push(`error/ok protan/deutan distance ${cvd.toFixed(0)} < ${CVD_DIST_WARN}`);
    }
  }

  return { failures, warnings };
}

export function checkAnsiMapping(ansiMapping, expected) {
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
