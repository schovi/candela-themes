// Guards guided dark-theme derivation: the Simple darkness slider crossing into
// dark, dark round-trips, mode-flip refitting, and Auto-fix honoring the declared
// mode. Runs via `npm test` (esbuild-bundled — see scripts/run-tests.mjs) because
// these modules use Vite-resolved extensionless imports node can't follow alone.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { deriveTheme, deriveChoices, applyBackground, DEFAULT_CHOICES } from './derive';
import { autoFix } from './autofix';
import { tokenReference, themes, type Theme } from './themes';
import { expectedTokens, checkTheme } from '../../lib/rules.js';
import { hexToHsl } from '../../lib/colors.js';

const EXPECTED = expectedTokens(tokenReference);
const failures = (theme: Theme) => (checkTheme(theme, EXPECTED) as { failures: string[] }).failures;
const bgL = (theme: Theme) => hexToHsl(theme.colors.bg).l;

test('default choices derive a valid light theme', () => {
  const light = deriveTheme(DEFAULT_CHOICES);
  assert.equal(light.mode, 'light');
  assert.deepEqual(failures(light), []);
});

test('darkness past the midpoint derives a valid dark theme for every mood', () => {
  for (const mood of ['warm', 'cool', 'neutral'] as const) {
    const dark = deriveTheme({ ...DEFAULT_CHOICES, mood, darkness: 100 });
    assert.equal(dark.mode, 'dark', `${mood} mode`);
    assert.ok(bgL(dark) < 0.5, `${mood} bg is dark`);
    assert.deepEqual(failures(dark), [], `${mood} dark passes hard rules`);
  }
});

test('dark derivation holds across representative accent hue sets', () => {
  const hueSets = [
    { kw: 200, str: 40, fn: 280, num: 100, type: 330, builtin: 20, punct: 60 },
    { kw: 0, str: 60, fn: 120, num: 180, type: 240, builtin: 300, punct: 90 },
  ];
  for (const accentHues of hueSets) {
    const dark = deriveTheme({ ...DEFAULT_CHOICES, darkness: 100, accentHues });
    assert.deepEqual(failures(dark), [], JSON.stringify(accentHues));
  }
});

test('a dark built-in theme reads back as a dark darkness position', () => {
  for (const builtin of themes.filter((t) => t.mode === 'dark')) {
    assert.ok(deriveChoices(builtin).darkness >= 50, `${builtin.id} >= 50`);
  }
});

test('dragging darkness across the midpoint flips mode and stays valid both ways', () => {
  const light = deriveTheme(DEFAULT_CHOICES);
  const dark = applyBackground(light, DEFAULT_CHOICES.mood, 85);
  assert.equal(dark.mode, 'dark');
  assert.deepEqual(failures(dark), []);
  const back = applyBackground(dark, DEFAULT_CHOICES.mood, 20);
  assert.equal(back.mode, 'light');
  assert.deepEqual(failures(back), []);
});

test('a same-mode darkness nudge leaves accents and diagnostics byte-identical', () => {
  const light = deriveTheme(DEFAULT_CHOICES);
  const nudged = applyBackground(light, DEFAULT_CHOICES.mood, 30);
  assert.equal(nudged.mode, 'light');
  for (const token of ['kw', 'str', 'fn', 'num', 'type', 'builtin', 'punct', 'error', 'warning', 'ok'] as const) {
    assert.equal(nudged.colors[token], light.colors[token], token);
  }
});

test('auto-fix moves bg toward the declared mode instead of always lightening', () => {
  const lightBuiltin = themes.find((t) => t.mode === 'light')!;
  const flippedToDark: Theme = { ...lightBuiltin, mode: 'dark', colors: { ...lightBuiltin.colors } };
  assert.ok(bgL(autoFix(flippedToDark)) < 0.5, 'mode dark darkens bg');

  const flippedToLight: Theme = { ...lightBuiltin, mode: 'light', colors: { ...lightBuiltin.colors, bg: '#1e1e28' } };
  assert.ok(bgL(autoFix(flippedToLight)) > 0.5, 'mode light lightens bg');
});
