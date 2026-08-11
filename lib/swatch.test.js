import assert from 'node:assert/strict';
import test from 'node:test';
import { assertWellFormedXml, swatchSvg } from './swatch.js';

const theme = {
  name: 'Moss & Magenta',
  tone: 'balanced',
  colors: {
    bg: '#112233', border: '#445566', ink: '#ddeeff', faint: '#aabbcc',
    kw: '#aa0000', str: '#00aa00', fn: '#0000aa', num: '#aaaa00', type: '#aa00aa', builtin: '#00aaaa', punct: '#cccccc',
  },
};

test('swatchSvg emits the homepage tile tokens as standalone XML', () => {
  const svg = swatchSvg(theme);

  assert.match(svg, /width="480" height="150" viewBox="0 0 480 150"/);
  assert.match(svg, /Moss &amp; Magenta/);
  for (const token of ['bg', 'ink', 'kw', 'str', 'fn', 'num', 'type', 'builtin']) {
    assert.match(svg, new RegExp(`<title>${token}</title>`));
  }
  assert.match(svg, /fill="#aa0000">def<\/text>/);
  assert.match(svg, /fill="#0000aa">total<\/text>/);
  assert.match(svg, /fill="#aaaa00">100\.0<\/text>/);
  assert.doesNotThrow(() => assertWellFormedXml(svg));
});

test('swatchSvg identifies incomplete themes and malformed XML', () => {
  assert.throws(() => swatchSvg({ ...theme, colors: { ...theme.colors, builtin: undefined } }), /builtin/);
  assert.throws(() => assertWellFormedXml('<?xml version="1.0" encoding="UTF-8"?>\n<svg><rect></svg>'), /Mismatched/);
  assert.throws(() => assertWellFormedXml('<?xml version="1.0" encoding="UTF-8"?>\n<svg'), /Unescaped/);
});
