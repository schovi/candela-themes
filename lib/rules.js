// Candela design invariants, in one place. The single source of the rule
// definitions from AGENTS.md ("Design rules to preserve").
// Consumed by two callers that must never diverge:
//   - scripts/validate.js  (Node pre-commit gate, adds fs + colored output)
//   - app/ theme playground (live feedback + gated export)
// Change a constant here and both reflect it. Pure and dependency-free apart
// from the hex helpers; never reads files or prints. ESM (see lib/package.json).

import {
  normalizeHex, hexToHsl, hexToOklch, relativeLuminance, contrastRatio, deltaEOk, simulateCvd,
  apcaContrast, compositeOver,
} from './colors.js';

export const AAA_CONTRAST = 7;
export const AA_CONTRAST = 4.5;
export const WHITE = '#ffffff';
export const BLACK = '#000000';
export const HUE_MIN = 6;
export const HUE_MAX = 8;
export const MODES = ['light', 'dark'];
// What kind of theme this is, on one axis. `solo` is the escape hatch for a theme
// that belongs to no family — currently unused, and the gallery derives its chips
// from the values actually present, so an empty category never shows up as a filter.
export const CATEGORIES = ['tone', 'heritage', 'experiment', 'solo'];
export const SYNTAX_ACCENTS = ['kw', 'str', 'fn', 'num', 'type', 'builtin', 'punct'];
export const DIAGNOSTICS = ['error', 'warning', 'ok'];
// Tokens that render as informational text and must clear WCAG AA on every
// ground they are painted on. ink2 is here because editors draw sidebar labels,
// status bars and line numbers in it. See docs/vision-research.md.
export const AA_TOKENS = [...SYNTAX_ACCENTS, ...DIAGNOSTICS, 'faint', 'ink2'];
// Every opaque background text sits on. bg is not always the binding one: a dark
// theme's surface and lineHighlight are lighter than bg, so light text loses
// contrast there. Selection is checked separately (ink must only clear AA on it).
export const TEXT_GROUNDS = ['bg', 'surface', 'lineHighlight'];

// Translucent status washes (diff added/removed text, diagnostic blocks) that
// editors paint behind ordinary syntax on the code area (surface). Emitters read
// the alpha from here so the validator checks the exact composite that ships.
export const WASH_TOKENS = ['error', 'warning', 'ok', 'fn', 'faint'];
export const WASH_ALPHA_HEX = '14';

// bg OKLab lightness that separates a light theme from a dark one. Perceptual, so
// a saturated ground can't sit on the wrong side the way it can in HSL.
export const MODE_LIGHTNESS_SPLIT = 0.6;
export function modeForBackground(bgHex) {
  return hexToOklch(bgHex).L < MODE_LIGHTNESS_SPLIT ? 'dark' : 'light';
}

// Purple tokens must sit at a different lightness than blue ones: protans and
// deutans lose purple's red component and see it as blue.
export const PURPLE_BLUE_MIN_DL = 0.05;
const BLUE_HUES = [220, 285];
const PURPLE_HUES = [285, 345];
const CHROMATIC = 0.04; // below this OKLCH chroma a token reads as gray
const ANSI_CHROMATIC = 0.02; // an ultra-low-chroma palette still tints its ANSI slots

// Terminal ANSI slots: the hue a program expects when it prints "red". OKLCH hue
// windows, generous enough for vermillion reds and teal greens.
export const ANSI_HUE_SLOTS = ['red', 'green', 'yellow', 'blue', 'magenta', 'cyan'];
const ANSI_HUE_WINDOWS = {
  red: [345, 55], yellow: [55, 115], green: [115, 205], cyan: [170, 240], blue: [215, 295], magenta: [285, 20],
};
// red/green/yellow carry meaning (failures, additions, warnings) and come from the
// diagnostics, so they always have a fitting token. Some palettes deliberately have
// no blue or magenta (low-blue, monochrome), so those slots only warn.
const ANSI_HARD_SLOTS = ['red', 'green', 'yellow'];
export const ANSI_NEUTRAL_SLOTS = ['black', 'white', 'brightBlack', 'brightWhite'];

// Warn-only judgement thresholds: tuned so the shipped palettes pass with margin,
// firing only on a real regression.
const GRAY_SEP_WARN = 1.3; // error vs ok luminance contrast (grayscale legibility)
const CVD_ERROR_OK_WARN = 0.05; // OKLab distance between error and ok after CVD simulation
const APCA_INK_WARN = 75; // APCA body-text floor
const APCA_TOKEN_WARN = 45; // APCA floor for short, non-body text (tokens, comments)
const CHROMA_WARN = 0.17; // OKLCH chroma above this fringes (chromatic aberration)
const LOOKALIKE_WARN = 0.03; // OKLab distance under which two syntax tokens read alike
const CVD_LOOKALIKE_WARN = 0.02; // same, after protan/deutan/tritan simulation
const SELECTION_VISIBLE_WARN = 0.04; // selection vs bg and vs lineHighlight

const inHueWindow = (h, [from, to]) => (from <= to ? h >= from && h <= to : h >= from || h <= to);

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

// The opaque color each status wash becomes once painted over the code area.
export function washGrounds(colors) {
  const alpha = parseInt(WASH_ALPHA_HEX, 16) / 255;
  return WASH_TOKENS.map((wash) => ({ label: `${wash} wash`, hex: compositeOver(colors[wash], alpha, colors.surface) }));
}

// The token a theme's ANSI slot resolves to: per-theme `ansi` override first,
// then the shared hue map or the mode's neutral map.
export function ansiSlotToken(ansiMapping, theme, slot) {
  if (ANSI_HUE_SLOTS.includes(slot)) return theme.ansi?.[slot] ?? ansiMapping.hues[slot];
  return ansiMapping.neutrals[theme.mode]?.[slot];
}

function checkAnsi(theme, ansiMapping, has, failures, warnings) {
  const c = theme.colors;
  for (const slot of Object.keys(theme.ansi ?? {})) {
    if (!ANSI_HUE_SLOTS.includes(slot)) failures.push(`ansi override '${slot}' is not a hue slot (${ANSI_HUE_SLOTS.join('/')})`);
  }
  for (const slot of [...ANSI_HUE_SLOTS, ...ANSI_NEUTRAL_SLOTS]) {
    const token = ansiSlotToken(ansiMapping, theme, slot);
    if (!has(token)) {
      failures.push(`ansi ${slot} -> '${token}' is not a known token`);
      continue;
    }
    if (!ANSI_HUE_SLOTS.includes(slot)) continue;
    const { C, h } = hexToOklch(c[token]);
    if (C >= ANSI_CHROMATIC && inHueWindow(h, ANSI_HUE_WINDOWS[slot])) continue;
    const message = `ansi ${slot} -> ${token} is hue ${h.toFixed(0)}° (chroma ${C.toFixed(2)}), not ${slot}`;
    (ANSI_HARD_SLOTS.includes(slot) ? failures : warnings).push(message);
  }
  const slotHex = (slot) => c[ansiSlotToken(ansiMapping, theme, slot)];
  const luminance = (slot) => (has(ansiSlotToken(ansiMapping, theme, slot)) ? relativeLuminance(slotHex(slot)) : NaN);
  for (const [dark, light] of [['black', 'white'], ['brightBlack', 'brightWhite']]) {
    if (!(luminance(dark) < luminance(light))) failures.push(`ansi ${dark} is not darker than ${light}`);
  }
  // Shells draw autosuggestions and `ls` dim entries in bright black.
  if (has(ansiSlotToken(ansiMapping, theme, 'brightBlack')) && has('bg')) {
    const ratio = contrastRatio(slotHex('brightBlack'), c.bg);
    if (ratio < AA_CONTRAST) failures.push(`ansi brightBlack on bg ${ratio.toFixed(2)}:1 < ${AA_CONTRAST}:1 (WCAG AA)`);
  }
}

export function checkTheme(theme, expected, ansiMapping) {
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

  if (!CATEGORIES.includes(theme.category)) {
    failures.push(`category ${JSON.stringify(theme.category)} is not one of ${CATEGORIES.join('/')}`);
  }

  if (has('bg') && MODES.includes(theme.mode) && modeForBackground(c.bg) !== theme.mode) {
    const lightness = hexToOklch(c.bg).L.toFixed(2);
    const side = theme.mode === 'light' ? '>' : '<';
    failures.push(`mode ${theme.mode} requires bg lightness ${side} ${MODE_LIGHTNESS_SPLIT} (OKLab L, got ${lightness})`);
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

  const grounds = TEXT_GROUNDS.filter(has);

  // Body text clears AAA on every ground it is painted on.
  if (has('ink')) {
    for (const ground of grounds) {
      const ratio = contrastRatio(c.ink, c[ground]);
      if (ratio < AAA_CONTRAST) {
        failures.push(`ink on ${ground} ${ratio.toFixed(2)}:1 < ${AAA_CONTRAST}:1 (WCAG AAA)`);
      }
    }
  }

  if (SYNTAX_ACCENTS.every(has)) {
    const hues = distinctAccentHues(c);
    if (hues < HUE_MIN || hues > HUE_MAX) {
      warnings.push(`${hues} distinct accent hues, outside ${HUE_MIN}-${HUE_MAX}`);
    }
  }

  // Every informational token clears WCAG AA on every ground, on the selection
  // (selection never repaints text, so syntax colors sit on it), and on the
  // translucent status washes editors paint behind code.
  const aaGrounds = [
    ...grounds.map((ground) => ({ label: ground, hex: c[ground] })),
    ...(has('selection') ? [{ label: 'selection', hex: c.selection }] : []),
    ...(WASH_TOKENS.every(has) && has('surface') ? washGrounds(c) : []),
  ];
  for (const token of AA_TOKENS) {
    if (!has(token)) continue;
    for (const ground of aaGrounds) {
      const ratio = contrastRatio(c[token], ground.hex);
      if (ratio < AA_CONTRAST) {
        failures.push(`${token} on ${ground.label} ${ratio.toFixed(2)}:1 < ${AA_CONTRAST}:1 (WCAG AA)`);
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

  // Purple vs blue: separated by lightness, not hue (see docs/vision-research.md).
  const hueTokens = SYNTAX_ACCENTS.filter((token) => token !== 'punct' && has(token))
    .map((token) => ({ token, ...hexToOklch(c[token]) }))
    .filter(({ C }) => C >= CHROMATIC);
  for (const purple of hueTokens.filter(({ h }) => inHueWindow(h, PURPLE_HUES))) {
    for (const blue of hueTokens.filter(({ h }) => inHueWindow(h, BLUE_HUES) && !inHueWindow(h, PURPLE_HUES))) {
      const dl = Math.abs(purple.L - blue.L);
      if (dl < PURPLE_BLUE_MIN_DL) {
        failures.push(`${purple.token} (purple) and ${blue.token} (blue) sit ${dl.toFixed(3)} apart in OKLab L < ${PURPLE_BLUE_MIN_DL}`);
      }
    }
  }

  if (ansiMapping) checkAnsi(theme, ansiMapping, has, failures, warnings);

  // ---- Warn-only judgement calls below; they never gate. ----

  // WCAG 2 overstates light-on-dark contrast; APCA is the cross-check.
  if (has('ink')) {
    for (const ground of grounds) {
      const lc = Math.abs(apcaContrast(c.ink, c[ground]));
      if (lc < APCA_INK_WARN) warnings.push(`ink APCA Lc ${lc.toFixed(0)} on ${ground} < ${APCA_INK_WARN}`);
    }
  }
  for (const token of AA_TOKENS.filter(has)) {
    const lc = Math.min(...grounds.map((ground) => Math.abs(apcaContrast(c[token], c[ground]))));
    if (lc < APCA_TOKEN_WARN) warnings.push(`${token} APCA Lc ${lc.toFixed(0)} < ${APCA_TOKEN_WARN}`);
  }

  // The load-bearing anti-fringing rule: accents stay desaturated.
  for (const token of [...SYNTAX_ACCENTS, ...DIAGNOSTICS].filter(has)) {
    const { C } = hexToOklch(c[token]);
    if (C > CHROMA_WARN) warnings.push(`${token} chroma ${C.toFixed(3)} > ${CHROMA_WARN} (too saturated)`);
  }

  // Syntax tokens that read as the same color, for everyone or for a dichromat.
  const syntax = SYNTAX_ACCENTS.filter((token) => token !== 'punct' && has(token));
  for (let i = 0; i < syntax.length; i++) {
    for (let j = i + 1; j < syntax.length; j++) {
      const [a, b] = [syntax[i], syntax[j]];
      if (normalizeHex(c[a]) === normalizeHex(c[b])) continue; // a deliberate shared hex
      const normal = deltaEOk(c[a], c[b]);
      if (normal < LOOKALIKE_WARN) {
        warnings.push(`${a}/${b} look alike (OKLab ΔE ${normal.toFixed(3)} < ${LOOKALIKE_WARN})`);
        continue;
      }
      for (const kind of ['protan', 'deutan', 'tritan']) {
        const simulated = deltaEOk(simulateCvd(c[a], kind), simulateCvd(c[b], kind));
        if (simulated < CVD_LOOKALIKE_WARN) {
          warnings.push(`${a}/${b} look alike for ${kind}s (OKLab ΔE ${simulated.toFixed(3)} < ${CVD_LOOKALIKE_WARN})`);
        }
      }
    }
  }

  // Role hierarchy: punctuation is its own muted role, secondary text outranks comments.
  for (const other of ['ink', 'faint']) {
    if (has('punct') && has(other)) {
      const distance = deltaEOk(c.punct, c[other]);
      if (distance < LOOKALIKE_WARN) warnings.push(`punct matches ${other} (OKLab ΔE ${distance.toFixed(3)} < ${LOOKALIKE_WARN})`);
    }
  }
  if (has('ink2') && has('faint') && has('bg') && contrastRatio(c.ink2, c.bg) <= contrastRatio(c.faint, c.bg)) {
    warnings.push(`ink2 ${contrastRatio(c.ink2, c.bg).toFixed(2)}:1 is not stronger than faint ${contrastRatio(c.faint, c.bg).toFixed(2)}:1`);
  }

  for (const other of ['bg', 'lineHighlight']) {
    if (has('selection') && has(other)) {
      const distance = deltaEOk(c.selection, c[other]);
      if (distance < SELECTION_VISIBLE_WARN) {
        warnings.push(`selection barely differs from ${other} (OKLab ΔE ${distance.toFixed(3)} < ${SELECTION_VISIBLE_WARN})`);
      }
    }
  }

  // Red/green diagnostics should read apart in grayscale and for protans/deutans.
  if (has('error') && has('ok')) {
    const gray = contrastRatio(c.error, c.ok);
    if (gray < GRAY_SEP_WARN) {
      warnings.push(`error/ok grayscale separation ${gray.toFixed(2)} < ${GRAY_SEP_WARN}`);
    }
    const cvd = Math.min(...['protan', 'deutan'].map((kind) => deltaEOk(simulateCvd(c.error, kind), simulateCvd(c.ok, kind))));
    if (cvd < CVD_ERROR_OK_WARN) {
      warnings.push(`error/ok protan/deutan distance ${cvd.toFixed(3)} < ${CVD_ERROR_OK_WARN}`);
    }
  }

  return { failures, warnings };
}

// `pair` is metadata only — nothing generates from it. Without this check it would
// silently rot the first time a paired theme is renamed, retoned, or dropped.
export function checkPairs(themes) {
  const failures = [];
  const byId = new Map(themes.map((theme) => [theme.id, theme]));
  for (const theme of themes) {
    if (!theme.pair) continue;
    const other = byId.get(theme.pair);
    if (!other) {
      failures.push(`${theme.id}: pair '${theme.pair}' is not a known theme id`);
      continue;
    }
    if (other.pair !== theme.id) {
      failures.push(`${theme.id}: pair '${theme.pair}' does not point back (got '${other.pair ?? 'none'}')`);
    }
    if (other.mode === theme.mode) {
      failures.push(`${theme.id}: pair '${theme.pair}' is also mode '${theme.mode}' (a pair is one light + one dark)`);
    }
  }
  return failures;
}

// Shape of the shared ANSI block: every hue slot and every per-mode neutral slot
// names a real token.
export function checkAnsiMapping(ansiMapping, expected) {
  const failures = [];
  const known = new Set(expected);
  const check = (label, token) => {
    if (!known.has(token)) failures.push(`ansiMapping.${label} -> '${token}' is not a known token`);
  };
  for (const slot of ANSI_HUE_SLOTS) check(`hues.${slot}`, ansiMapping.hues?.[slot]);
  for (const mode of MODES) {
    for (const slot of ANSI_NEUTRAL_SLOTS) check(`neutrals.${mode}.${slot}`, ansiMapping.neutrals?.[mode]?.[slot]);
  }
  return failures;
}
