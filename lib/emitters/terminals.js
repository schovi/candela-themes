// The six flat-file terminal formats: one file per theme, built from the shared
// resolveTerminal() shape. TERMINAL_FORMATS is the single registry — both the
// per-tool export and the packaged family iterate it.

import { hexToFloat } from '../colors.js';
import { ANSI_ORDER } from './shared.js';

function itermColor(hex) {
  const { r, g, b } = hexToFloat(hex);
  return [
    '\t\t<key>Alpha Component</key>',
    '\t\t<real>1</real>',
    '\t\t<key>Blue Component</key>',
    `\t\t<real>${b}</real>`,
    '\t\t<key>Color Space</key>',
    '\t\t<string>sRGB</string>',
    '\t\t<key>Green Component</key>',
    `\t\t<real>${g}</real>`,
    '\t\t<key>Red Component</key>',
    `\t\t<real>${r}</real>`,
  ].join('\n');
}

function emitIterm(t) {
  const entry = (key, hex) => `\t<key>${key}</key>\n\t<dict>\n${itermColor(hex)}\n\t</dict>`;
  const lines = [];
  t.ansi.forEach((hex, i) => lines.push(entry(`Ansi ${i} Color`, hex)));
  lines.push(entry('Background Color', t.background));
  lines.push(entry('Foreground Color', t.foreground));
  lines.push(entry('Cursor Color', t.cursor));
  lines.push(entry('Selection Color', t.selection));
  // An .itermcolors file only overwrites the keys it contains, so omitting these two
  // leaves whatever the profile had — often an unreadable pair on our selection and
  // cursor. `ink` on `selection` is the pair validate.js already gates at AA.
  lines.push(entry('Selected Text Color', t.foreground));
  lines.push(entry('Cursor Text Color', t.background));
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    lines.join('\n'),
    '</dict>',
    '</plist>',
    '',
  ].join('\n');
}

function emitAlacritty(t) {
  const set = (offset) => ANSI_ORDER.map((name, i) => `${name} = "${t.ansi[offset + i]}"`).join('\n');
  return [
    '[colors.primary]',
    `background = "${t.background}"`,
    `foreground = "${t.foreground}"`,
    '',
    '[colors.cursor]',
    `cursor = "${t.cursor}"`,
    '',
    '[colors.selection]',
    // Alacritty defaults `text` to CellBackground, so a scheme that sets only
    // `background` paints selected text in the theme's own bg — invisible on a light
    // theme. CellForeground keeps each cell's syntax color, which is the invariant.
    'text = "CellForeground"',
    `background = "${t.selection}"`,
    '',
    '[colors.normal]',
    set(0),
    '',
    '[colors.bright]',
    set(8),
    '',
  ].join('\n');
}

function emitKitty(t) {
  const lines = [
    `background ${t.background}`,
    `foreground ${t.foreground}`,
    `cursor ${t.cursor}`,
    `selection_background ${t.selection}`,
    // kitty's built-in defaults are selection_foreground #000000 and
    // cursor_text_color #111111; unset, both repaint text in a hardcoded near-black
    // unrelated to the palette. `none` keeps the cell's own color.
    'selection_foreground none',
    `cursor_text_color ${t.background}`,
  ];
  t.ansi.forEach((hex, i) => lines.push(`color${i} ${hex}`));
  return lines.join('\n') + '\n';
}

function emitWezterm(t) {
  const arr = (offset) => '[' + ANSI_ORDER.map((_, i) => `"${t.ansi[offset + i]}"`).join(', ') + ']';
  return [
    '[colors]',
    `foreground = "${t.foreground}"`,
    `background = "${t.background}"`,
    `cursor_bg = "${t.cursor}"`,
    `cursor_border = "${t.cursor}"`,
    `cursor_fg = "${t.background}"`,
    // 'none' means "keep the cell's own text color"; unset, WezTerm applies the
    // built-in scheme's selection_fg over our selection_bg.
    "selection_fg = 'none'",
    `selection_bg = "${t.selection}"`,
    `ansi = ${arr(0)}`,
    `brights = ${arr(8)}`,
    '',
  ].join('\n');
}

// Windows Terminal calls the magenta slot "purple".
const WT_NAMES = ANSI_ORDER.map((name) => (name === 'magenta' ? 'purple' : name));

function emitWindowsTerminal(t, theme) {
  const scheme = {
    name: `Candela ${theme.name}`,
    background: t.background,
    foreground: t.foreground,
    cursorColor: t.cursor,
    selectionBackground: t.selection,
  };
  WT_NAMES.forEach((name, i) => {
    scheme[name] = t.ansi[i];
    scheme['bright' + name[0].toUpperCase() + name.slice(1)] = t.ansi[i + 8];
  });
  return JSON.stringify(scheme, null, 2) + '\n';
}

function emitGhostty(t) {
  const lines = [
    `background = ${t.background}`,
    `foreground = ${t.foreground}`,
    `cursor-color = ${t.cursor}`,
    `selection-background = ${t.selection}`,
    // Unset, Ghostty inverts the window fg/bg for selections, which pairs our own bg
    // with our selection color. cell-foreground (Ghostty 1.2+) keeps the cell's syntax
    // color instead; older builds warn about the value and skip the line.
    'selection-foreground = cell-foreground',
    `cursor-text = ${t.background}`,
  ];
  t.ansi.forEach((hex, i) => lines.push(`palette = ${i}=${hex}`));
  return lines.join('\n') + '\n';
}

export const TERMINAL_FORMATS = [
  { tool: 'iterm2', label: 'iTerm2', ext: 'itermcolors', emit: emitIterm },
  { tool: 'alacritty', label: 'Alacritty', ext: 'toml', emit: emitAlacritty },
  { tool: 'kitty', label: 'Kitty', ext: 'conf', emit: emitKitty },
  { tool: 'wezterm', label: 'WezTerm', ext: 'toml', emit: emitWezterm },
  { tool: 'windows-terminal', label: 'Windows Terminal', ext: 'json', emit: emitWindowsTerminal },
  { tool: 'ghostty', label: 'Ghostty', ext: 'conf', emit: emitGhostty },
];
