// Hex color helpers, one place, reused by every emitter.
// Input is always a `#rrggbb` string from aurora-themes.json.
// ESM (see lib/package.json): imported natively by the app and by lib/rules.js,
// and via Node 22's require(ESM) from the CommonJS scripts under scripts/.

export function normalizeHex(hex) {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!match) throw new Error(`Not a #rrggbb hex color: ${hex}`);
  return `#${match[1].toLowerCase()}`;
}

export function hexToRgb(hex) {
  const h = normalizeHex(hex).slice(1);
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

// iTerm2 stores components as 0..1 floats.
export function hexToFloat(hex) {
  const { r, g, b } = hexToRgb(hex);
  return { r: r / 255, g: g / 255, b: b / 255 };
}

// WCAG relative luminance of a color (0 = black, 1 = white).
export function relativeLuminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  const linear = (channel) => {
    const c = channel / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

// WCAG contrast ratio between two colors, 1:1 to 21:1. Order-independent.
export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}
