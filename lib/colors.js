// Hex color helpers, one place, reused by every emitter.
// Input is always a `#rrggbb` string from candela-themes.json.
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

const XTERM_SYSTEM_COLORS = [
  [0, 0, 0], [205, 0, 0], [0, 205, 0], [205, 205, 0],
  [0, 0, 238], [205, 0, 205], [0, 205, 205], [229, 229, 229],
  [127, 127, 127], [255, 0, 0], [0, 255, 0], [255, 255, 0],
  [92, 92, 255], [255, 0, 255], [0, 255, 255], [255, 255, 255],
];
const XTERM_CUBE_VALUES = [0, 95, 135, 175, 215, 255];
const XTERM_256_COLORS = [
  ...XTERM_SYSTEM_COLORS,
  ...XTERM_CUBE_VALUES.flatMap((r) => XTERM_CUBE_VALUES.flatMap((g) => XTERM_CUBE_VALUES.map((b) => [r, g, b]))),
  ...Array.from({ length: 24 }, (_, index) => Array(3).fill(8 + index * 10)),
];

// Nearest xterm-256 palette index for Vim's cterm fallbacks, by OKLab distance
// (RGB distance pulls near-grays toward tinted cube colors). Palette is converted
// lazily: the OKLab helpers are defined further down.
let xtermOklab;
export function hexToXterm256Index(hex) {
  xtermOklab ??= XTERM_256_COLORS.map(([r, g, b]) => linearRgbToOklab([linearChannel(r), linearChannel(g), linearChannel(b)]));
  const target = hexToOklab(hex);
  let closestIndex = 0;
  let closestDistance = Infinity;
  for (const [index, color] of xtermOklab.entries()) {
    const distance = (target.L - color.L) ** 2 + (target.a - color.a) ** 2 + (target.b - color.b) ** 2;
    if (distance < closestDistance) {
      closestIndex = index;
      closestDistance = distance;
    }
  }
  return closestIndex;
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

// #rrggbb -> HSL ({ h: 0..360, s: 0..1, l: 0..1 }). Used by the playground's
// auto-fix to move a color's lightness while keeping its hue and chroma.
export function hexToHsl(hex) {
  let { r, g, b } = hexToRgb(hex);
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (delta !== 0) {
    s = delta / (1 - Math.abs(2 * l - 1));
    if (max === r) h = ((g - b) / delta) % 6;
    else if (max === g) h = (b - r) / delta + 2;
    else h = (r - g) / delta + 4;
    h = (h * 60 + 360) % 360;
  }
  return { h, s, l };
}

// HSL -> #rrggbb (inverse of hexToHsl).
export function hslToHex({ h, s, l }) {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) { r = c; g = x; }
  else if (h < 120) { r = x; g = c; }
  else if (h < 180) { g = c; b = x; }
  else if (h < 240) { g = x; b = c; }
  else if (h < 300) { r = x; b = c; }
  else { r = c; b = x; }
  const channel = (v) => Math.round((v + m) * 255).toString(16).padStart(2, '0');
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

// WCAG contrast ratio between two colors, 1:1 to 21:1. Order-independent.
export function contrastRatio(hexA, hexB) {
  const a = relativeLuminance(hexA);
  const b = relativeLuminance(hexB);
  const lighter = Math.max(a, b);
  const darker = Math.min(a, b);
  return (lighter + 0.05) / (darker + 0.05);
}

// sRGB channel (0..255) -> linear light (0..1).
function linearChannel(channel) {
  const c = channel / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function linearRgbToHex([r, g, b]) {
  const channel = (v) => {
    const c = Math.min(1, Math.max(0, v));
    const encoded = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
    return Math.round(encoded * 255).toString(16).padStart(2, '0');
  };
  return `#${channel(r)}${channel(g)}${channel(b)}`;
}

function linearRgbToOklab([r, g, b]) {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return {
    L: 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    a: 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    b: 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  };
}

function oklabToLinearRgb({ L, a, b }) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const hexToLinearRgb = (hex) => {
  const { r, g, b } = hexToRgb(hex);
  return [linearChannel(r), linearChannel(g), linearChannel(b)];
};

// OKLab: perceptual lightness L (0..1) and opponent axes a/b. Distances in it
// track perceived difference far better than RGB or HSL.
export const hexToOklab = (hex) => linearRgbToOklab(hexToLinearRgb(hex));

// OKLCH = OKLab in polar form: { L: 0..1, C: chroma (~0..0.37), h: 0..360 }.
export function hexToOklch(hex) {
  const { L, a, b } = hexToOklab(hex);
  return { L, C: Math.hypot(a, b), h: (Math.atan2(b, a) * 180 / Math.PI + 360) % 360 };
}

// OKLCH -> #rrggbb. Out-of-gamut colors keep L and h and lose chroma until they
// fit sRGB, so a lightness edit never shifts hue.
export function oklchToHex({ L, C, h }) {
  const toLinear = (chroma) => {
    const radians = (h * Math.PI) / 180;
    return oklabToLinearRgb({ L, a: chroma * Math.cos(radians), b: chroma * Math.sin(radians) });
  };
  const inGamut = (rgb) => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);
  if (inGamut(toLinear(C))) return linearRgbToHex(toLinear(C));
  let low = 0;
  let high = C;
  for (let i = 0; i < 24; i++) {
    const mid = (low + high) / 2;
    if (inGamut(toLinear(mid))) low = mid;
    else high = mid;
  }
  return linearRgbToHex(toLinear(low));
}

// Euclidean OKLab distance. ~0.02 is a just-noticeable difference for adjacent
// swatches; small text needs several times that to read as a different color.
export function deltaEOk(hexA, hexB) {
  const a = hexToOklab(hexA);
  const b = hexToOklab(hexB);
  return Math.hypot(a.L - b.L, a.a - b.a, a.b - b.b);
}

// Machado, Oliveira & Fernandes (2009) dichromacy matrices, severity 1.0. They
// operate on linear RGB; applying them to gamma-encoded values overstates
// differences in the darks.
export const CVD_MATRICES = {
  protan: [[0.152286, 1.052583, -0.204868], [0.114503, 0.786281, 0.099216], [-0.003882, -0.048116, 1.051998]],
  deutan: [[0.367322, 0.860646, -0.227968], [0.280085, 0.672501, 0.047413], [-0.01182, 0.04294, 0.968881]],
  tritan: [[1.255528, -0.076749, -0.178779], [-0.078411, 0.930809, 0.147602], [0.004733, 0.691367, 0.3039]],
};

// How a color looks to a dichromat of the given kind ('protan' | 'deutan' | 'tritan').
export function simulateCvd(hex, kind) {
  const rgb = hexToLinearRgb(hex);
  return linearRgbToHex(CVD_MATRICES[kind].map((row) => row[0] * rgb[0] + row[1] * rgb[1] + row[2] * rgb[2]));
}

// APCA lightness contrast (Lc), version 0.0.98G-4g. Positive for dark text on a
// light background, negative for light on dark; compare magnitudes. WCAG 2 ratios
// overstate contrast for light text on dark grounds, which APCA corrects.
export function apcaContrast(textHex, backgroundHex) {
  const screenLuminance = (hex) => {
    const { r, g, b } = hexToRgb(hex);
    const y = 0.2126729 * (r / 255) ** 2.4 + 0.7151522 * (g / 255) ** 2.4 + 0.072175 * (b / 255) ** 2.4;
    return y > 0.022 ? y : y + (0.022 - y) ** 1.414;
  };
  const text = screenLuminance(textHex);
  const background = screenLuminance(backgroundHex);
  if (Math.abs(background - text) < 0.0005) return 0;
  if (background > text) {
    const s = (background ** 0.56 - text ** 0.57) * 1.14;
    return s < 0.1 ? 0 : (s - 0.027) * 100;
  }
  const s = (background ** 0.65 - text ** 0.62) * 1.14;
  return s > -0.1 ? 0 : (s + 0.027) * 100;
}

// Paint `hex` at `alpha` (0..1) over an opaque background, in sRGB like browsers
// and editors composite #rrggbbaa colors.
export function compositeOver(hex, alpha, backgroundHex) {
  const top = hexToRgb(hex);
  const bottom = hexToRgb(backgroundHex);
  const channel = (t, b) => Math.round(t * alpha + b * (1 - alpha)).toString(16).padStart(2, '0');
  return `#${channel(top.r, bottom.r)}${channel(top.g, bottom.g)}${channel(top.b, bottom.b)}`;
}
