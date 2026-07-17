'use strict';

// Hex color helpers, one place, reused by every emitter.
// Input is always a `#rrggbb` string from aurora-themes.json.

function normalizeHex(hex) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) throw new Error(`Not a #rrggbb hex color: ${hex}`);
  return `#${match[1].toLowerCase()}`;
}

function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// iTerm2 stores components as 0..1 floats.
function hexToFloat(hex) {
  const { r, g, b } = hexToRgb(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

module.exports = { normalizeHex, hexToRgb, hexToFloat };
