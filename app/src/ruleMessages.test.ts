// Guards the display plumbing against lib/rules.js drift: every message the rule
// module actually emits must stay parseable by explainRuleMessage (so it always
// gets a plain-language explanation) and, when it names a token, by
// jumpTokenForMessage. Reword a message in rules.js and this fails loudly instead
// of the jump/explanation silently dropping. Excluded from tsc; run with:
//   node --experimental-strip-types --test src/ruleMessages.test.ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { checkTheme } from '../../lib/rules.js';
import { explainRuleMessage, jumpTokenForMessage } from './ruleMessages.ts';

// A theme that clears every hard invariant (mirrors Playground's BLANK_TEMPLATE).
const BASE = {
  id: 'base', name: 'Base', tone: 'custom', tags: ['custom'], mode: 'light',
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
  Object.assign(theme, patch);
  if (patch.colors) Object.assign(theme.colors, patch.colors);
  return theme;
}

// Each fixture provokes one message family from lib/rules.js.
const FIXTURES = [
  mutate({ colors: { kw: undefined } }),                 // missing token
  mutate({ mode: 'weird' }),                             // mode not light/dark
  mutate({ mode: 'dark' }),                              // mode/bg-lightness mismatch
  mutate({ tags: [] }),                                  // bad tags
  mutate({ colors: { bg: '#ffffff' } }),                 // bg pure white
  mutate({ colors: { surface: '#ffffff' } }),            // surface pure white
  mutate({ colors: { surface: '#111111' } }),            // surface not lighter than bg
  mutate({ colors: { ink: '#000000' } }),                // ink pure black
  mutate({ colors: { kw: '#f4f2ee' } }),                 // contrast floor (kw on bg)
  mutate({ colors: { error: '#a05a3a' } }),              // diagnostic collision (error==num)
  mutate({ colors: { kw: '#8a5a2b', str: '#8a5a2b', fn: '#8a5a2b', num: '#8a5a2b', type: '#8a5a2b', builtin: '#8a5a2b', punct: '#8a5a2b' } }), // accent-hue warning
  mutate({ colors: { ok: '#b6452f' } }),                 // error/ok grayscale + protan/deutan warnings
];

test('every emitted rule message has an explanation', () => {
  const seen = new Set();
  for (const fixture of FIXTURES) {
    const { failures, warnings } = checkTheme(fixture, EXPECTED);
    for (const message of [...failures, ...warnings]) {
      seen.add(message);
      assert.ok(explainRuleMessage(message), `no explanation for: ${message}`);
    }
  }
  // Sanity: the fixtures really did exercise the parser, not silently pass.
  assert.ok(seen.size >= 10, `expected many messages, saw ${seen.size}`);
});

test('token-bearing messages jump to the right token', () => {
  const cases = [
    ["missing token 'kw'", 'kw'],
    ['kw on bg 1.00:1 < 4.5:1 (WCAG AA)', 'kw'],
    ['ink on surface 2.00:1 < 7:1 (WCAG AAA)', 'ink'],
    ['bg is pure #ffffff (halation)', 'bg'],
    ['surface #111111 not lighter than bg #f4f2ee', 'surface'],
    ['diagnostic collision: error and num share #a05a3a', 'error'],
    ['mode dark requires bg lightness < 0.5 (got 0.94)', 'bg'],
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
