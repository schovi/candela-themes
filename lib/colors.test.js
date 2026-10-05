import assert from 'node:assert/strict';
import test from 'node:test';
import {
  apcaContrast, compositeOver, deltaEOk, hexToOklch, hexToXterm256Index, oklchToHex, simulateCvd,
} from './colors.js';

test('OKLCH round-trips sRGB hexes', () => {
  for (const hex of ['#f2ecdf', '#322f28', '#9a5b2c', '#30577d', '#7b5595', '#000000', '#ffffff']) {
    assert.equal(oklchToHex(hexToOklch(hex)), hex);
  }
});

test('OKLCH -> hex clamps chroma, not lightness, when out of gamut', () => {
  const out = hexToOklch(oklchToHex({ L: 0.9, C: 0.4, h: 264 }));
  assert.ok(Math.abs(out.L - 0.9) < 0.005);
  assert.ok(Math.abs(out.h - 264) < 2);
});

test('APCA matches the reference values', () => {
  // Reference pairs from the APCA 0.0.98G-4g README.
  assert.ok(Math.abs(apcaContrast('#888888', '#ffffff') - 63.06) < 0.1);
  assert.ok(Math.abs(apcaContrast('#ffffff', '#888888') + 68.54) < 0.1);
  assert.ok(Math.abs(apcaContrast('#000000', '#aaaaaa') - 58.15) < 0.1);
});

test('CVD simulation collapses red/green for a deutan, not blue/orange', () => {
  assert.ok(deltaEOk(simulateCvd('#c0504d', 'deutan'), simulateCvd('#7f9a48', 'deutan')) < 0.08);
  assert.ok(deltaEOk(simulateCvd('#0072b2', 'deutan'), simulateCvd('#e69f00', 'deutan')) > 0.2);
});

test('compositeOver blends in sRGB', () => {
  assert.equal(compositeOver('#ffffff', 0.5, '#000000'), '#808080');
  assert.equal(compositeOver('#123456', 0, '#abcdef'), '#abcdef');
});

test('xterm-256 fallback uses the perceptually nearest palette color', () => {
  assert.equal(hexToXterm256Index('#000000'), 0);
  assert.equal(hexToXterm256Index('#ffffff'), 15);
  assert.equal(hexToXterm256Index('#ff0000'), 9);
  assert.equal(hexToXterm256Index('#005f00'), 22);
});
