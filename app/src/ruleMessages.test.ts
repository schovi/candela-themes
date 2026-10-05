// Guards the display plumbing against lib/rules.js drift: every message the rule
// module actually emits must stay parseable by explainRuleMessage (so it always
// gets a plain-language explanation) and, when it names a token, by
// jumpTokenForMessage. Reword a message in rules.js and this fails loudly instead
// of the jump/explanation silently dropping. Excluded from tsc; run with:
//   node --experimental-strip-types --test src/ruleMessages.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTheme } from '../../lib/rules.js';
import { ansiMapping } from './themes.ts';
import { explainRuleMessage, jumpTokenForMessage } from './ruleMessages.ts';

// A theme that clears every hard invariant (mirrors Playground's BLANK_TEMPLATE).
const BASE = {
  id: 'base', name: 'Base', category: 'solo', tone: 'custom', tags: ['custom'], mode: 'light',
  description: '', fonts: { code: 'x', prose: 'y' },
  colors: {
    bg: '#f4f2ee', surface: '#fbfaf7', border: '#dcd8d0',
    ink: '#2b2a27', ink2: '#5c5a54', faint: '#706d66',
    selection: '#e6e1d6', cursor: '#2b2a27', lineHighlight: '#f0ede6',
    kw: '#8a5a2b', str: '#557746', fn: '#3a6ea5', num: '#a05a3a',
    type: '#7a5aa5', builtin: '#277777', punct: '#6b6862',
    error: '#b5442f', warning: '#8b691d', ok: '#557746',
  },
};
const EXPECTED = Object.keys(BASE.colors);

function mutate(patch) {
  const theme = structuredClone(BASE);
  const { colors, ...fields } = patch;
  Object.assign(theme, fields);
  if (colors) Object.assign(theme.colors, colors);
  return theme;
}

// Each fixture provokes one message family from lib/rules.js.
const FIXTURES = [
  mutate({ colors: { kw: undefined } }),                 // missing token
  mutate({ mode: 'weird' }),                             // mode not light/dark
  mutate({ mode: 'dark' }),                              // mode/bg-lightness mismatch
  mutate({ category: 'unknown' }),                       // bad category
  mutate({ tags: [] }),                                  // bad tags
  mutate({ colors: { bg: '#ffffff' } }),                 // bg pure white
  mutate({ colors: { surface: '#ffffff' } }),            // surface pure white
  mutate({ colors: { surface: '#111111' } }),            // surface not lighter than bg
  mutate({ colors: { ink: '#000000' } }),                // ink pure black
  mutate({ colors: { ink: '#f0f0f0', ink2: '#f5f5f5', faint: '#202020' } }), // every contrast ground, APCA, ANSI neutrals
  mutate({ colors: { error: '#a05a3a' } }),              // diagnostic collision (error==num)
  mutate({ colors: { kw: '#8a5a2b', str: '#8a5a2b', fn: '#8a5a2b', num: '#8a5a2b', type: '#8a5a2b', builtin: '#8a5a2b', punct: '#8a5a2b' } }), // accent-hue warning
  mutate({ colors: { ok: '#b6452f' } }),                 // error/ok grayscale + protan/deutan warnings
  mutate({ colors: { type: '#7060a0', fn: '#6060a0' } }), // purple/blue lightness failure
  mutate({ ansi: { red: 'str' } }),                      // ANSI hue failure
  mutate({ ansi: { red: 'unknown' } }),                  // ANSI unknown token
  mutate({ ansi: { orange: 'kw' } }),                    // ANSI invalid override
  mutate({ colors: { kw: '#ff0000' } }),                 // chroma warning
  mutate({ colors: { kw: '#aa4400', str: '#aa4401' } }), // normal and CVD look-alike warnings
  mutate({ colors: { punct: BASE.colors.ink } }),        // punctuation/ink warning
  mutate({ colors: { punct: BASE.colors.faint } }),      // punctuation/faint warning
  mutate({ colors: { selection: BASE.colors.bg } }),     // selection visibility warning
];

const EXPECTED_MESSAGE_FAMILIES = [
  /^missing token /, /^mode .*is not one of light\/dark$/, /^mode .*requires bg lightness /,
  /^category /, /^tags must /, /^bg is pure /, /^surface is pure /,
  /^surface .*not lighter than bg /, /^ink is pure /, /^ink on (?:bg|surface|lineHighlight) /,
  /^ink2 on \w+ wash /, /^ink on selection /, /^diagnostic collision: /,
  /distinct accent hues/, /^error\/ok grayscale separation /, /^error\/ok protan\/deutan distance /,
  /^\w+ \(purple\) and \w+ \(blue\) sit /, /^ansi red -> str is hue /,
  /^ansi red -> 'unknown' is not a known token$/, /^ansi override /,
  /^ansi black is not darker than white$/, /^ansi brightBlack is not darker than brightWhite$/,
  /^ansi brightBlack on bg /,
  /^ink APCA Lc /, /^ink2 APCA Lc /, /^kw chroma /, /^kw\/str look alike/,
  /^punct matches ink /, /^punct matches faint /, /^ink2 .*is not stronger than faint /,
  /^selection barely differs from /,
];

test('every emitted rule message has an explanation', () => {
  const seen = new Set();
  for (const fixture of FIXTURES) {
    const { failures, warnings } = checkTheme(fixture, EXPECTED, ansiMapping);
    for (const message of [...failures, ...warnings]) {
      seen.add(message);
      assert.ok(explainRuleMessage(message), `no explanation for: ${message}`);
    }
  }
  for (const family of EXPECTED_MESSAGE_FAMILIES) {
    assert.ok([...seen].some((message) => family.test(message)), `fixture missed message family: ${family}`);
  }
});

test('token-bearing messages jump to the right token', () => {
  const cases = [
    ["missing token 'kw'", 'kw'],
    ['kw on bg 1.00:1 < 4.5:1 (WCAG AA)', 'kw'],
    ['ink2 on error wash 1.00:1 < 4.5:1 (WCAG AA)', 'ink2'],
    ['ink on surface 2.00:1 < 7:1 (WCAG AAA)', 'ink'],
    ['bg is pure #ffffff (halation)', 'bg'],
    ['surface #111111 not lighter than bg #f4f2ee', 'surface'],
    ['diagnostic collision: error and num share #a05a3a', 'error'],
    ['mode dark requires bg lightness < 0.6 (OKLab L, got 0.94)', 'bg'],
    ['type (purple) and fn (blue) sit 0.010 apart in OKLab L < 0.05', 'type'],
    ['ansi red -> error is hue 120° (chroma 0.08), not red', 'error'],
    ["ansi red -> 'kw' is not a known token", 'kw'],
    ['ink APCA Lc 40 on bg < 75', 'ink'],
    ['kw chroma 0.200 > 0.17 (too saturated)', 'kw'],
    ['kw/str look alike for tritans (OKLab ΔE 0.010 < 0.02)', 'kw'],
    ['punct matches faint (OKLab ΔE 0.010 < 0.03)', 'punct'],
    ['ink2 4.00:1 is not stronger than faint 5.00:1', 'ink2'],
    ['selection barely differs from bg (OKLab ΔE 0.010 < 0.04)', 'selection'],
    ['error/ok grayscale separation 1.00 < 1.3', 'error'],
  ];
  for (const [message, token] of cases) {
    assert.equal(jumpTokenForMessage(message), token, `wrong jump for: ${message}`);
  }
});

test('messages that name no single token do not jump', () => {
  assert.equal(jumpTokenForMessage('tags must be a non-empty array of strings'), null);
  assert.equal(jumpTokenForMessage('mode "weird" is not one of light/dark'), null);
});

// The hex-format error is synthesized by Playground (not rules.js) before the
// shared module runs; lock its parsing too since it flows through the same rows.
test('the Playground hex-format message parses', () => {
  const message = 'kw is not a #rrggbb hex color';
  assert.ok(explainRuleMessage(message));
  assert.equal(jumpTokenForMessage(message), 'kw');
});
