// Pieces every emitter needs: ANSI resolution, hex shorthands, the {path, content}
// file record, and the identity constants that end up in generated manifests.

import { normalizeHex } from '../colors.js';

// Fixed 0..7 ANSI slot order; slots 8..15 repeat it as the "bright" set.
export const ANSI_ORDER = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

// Shorthands for the large color-map literals in the editor emitters.
export const n = (hex) => normalizeHex(hex);
// VS Code and Zed both accept #rrggbbaa.
export const alpha = (hex, aa) => n(hex) + aa;
export const cap = (s) => s[0].toUpperCase() + s.slice(1);

export const file = (path, content) => ({ path, content });

// Fallback for single-theme app exports; the packaged family threads the root
// package.json version through emitFullFamily so `npm version` drives every manifest.
export const DEFAULT_VERSION = '0.1.0';
export const REPO_URL = 'https://github.com/schovi/candela-themes';
export const HOMEPAGE_URL = 'https://candela.ink';

// Resolve a theme's 16 ANSI colors from the JSON's ansiMapping (token names)
// against the theme's own palette. Returns 16 hex strings, index = ANSI slot.
export function resolveAnsi(ansiMapping, colors) {
  const slot = (map, name) => normalizeHex(colors[map[name]]);
  return [
    ...ANSI_ORDER.map((name) => slot(ansiMapping.normal, name)),
    ...ANSI_ORDER.map((name) => slot(ansiMapping.bright, name)),
  ];
}

// A theme's resolved terminal colors, shared by every terminal emitter.
export function resolveTerminal(theme, ansiMapping) {
  const c = theme.colors;
  return {
    background: normalizeHex(c.bg),
    foreground: normalizeHex(c.ink),
    cursor: normalizeHex(c.cursor),
    selection: normalizeHex(c.selection),
    ansi: resolveAnsi(ansiMapping, c),
  };
}
