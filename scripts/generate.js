'use strict';

// Aurora theme generator. Reads docs/design-handover/aurora-themes.json (the
// single source of truth) and writes dist/<tool>/<theme-id>.<ext> for every
// terminal format. Zero runtime dependencies — runs on a stock Node install.
//
// dist/ is wiped and rewritten on each run so output is deterministic and
// diffable. Downstream tasks (VS Code, IntelliJ, extra formats) extend this
// same scaffolding.

const fs = require('fs');
const path = require('path');
const { normalizeHex, hexToFloat } = require('../lib/colors');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'docs/design-handover/aurora-themes.json');
const DIST = path.join(ROOT, 'dist');

// Fixed 0..7 ANSI slot order; slots 8..15 repeat it as the "bright" set.
const ANSI_ORDER = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

// Resolve a theme's 16 ANSI colors from the JSON's ansiMapping (token names)
// against the theme's own palette. Returns 16 hex strings, index = ANSI slot.
function resolveAnsi(ansiMapping, colors) {
  const slot = (map, name) => normalizeHex(colors[map[name]]);
  return [
    ...ANSI_ORDER.map((name) => slot(ansiMapping.normal, name)),
    ...ANSI_ORDER.map((name) => slot(ansiMapping.bright, name)),
  ];
}

// A theme's resolved terminal colors, shared by every emitter.
function resolveTerminal(theme, ansiMapping) {
  const c = theme.colors;
  return {
    background: normalizeHex(c.bg),
    foreground: normalizeHex(c.ink),
    cursor: normalizeHex(c.cursor),
    selection: normalizeHex(c.selection),
    ansi: resolveAnsi(ansiMapping, c),
  };
}

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
  const set = (name, offset) =>
    ANSI_ORDER.map((n, i) => `${n} = "${t.ansi[offset + i]}"`).join('\n');
  return [
    '[colors.primary]',
    `background = "${t.background}"`,
    `foreground = "${t.foreground}"`,
    '',
    '[colors.cursor]',
    `cursor = "${t.cursor}"`,
    '',
    '[colors.selection]',
    `background = "${t.selection}"`,
    '',
    '[colors.normal]',
    set('normal', 0),
    '',
    '[colors.bright]',
    set('bright', 8),
    '',
  ].join('\n');
}

function emitKitty(t) {
  const lines = [
    `background ${t.background}`,
    `foreground ${t.foreground}`,
    `cursor ${t.cursor}`,
    `selection_background ${t.selection}`,
  ];
  t.ansi.forEach((hex, i) => lines.push(`color${i} ${hex}`));
  return lines.join('\n') + '\n';
}

function emitWezterm(t) {
  const arr = (offset) =>
    '[' + ANSI_ORDER.map((n, i) => `"${t.ansi[offset + i]}"`).join(', ') + ']';
  return [
    '[colors]',
    `foreground = "${t.foreground}"`,
    `background = "${t.background}"`,
    `cursor_bg = "${t.cursor}"`,
    `cursor_border = "${t.cursor}"`,
    `selection_bg = "${t.selection}"`,
    `ansi = ${arr(0)}`,
    `brights = ${arr(8)}`,
    '',
  ].join('\n');
}

// Windows Terminal calls the magenta slot "purple".
const WT_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'purple', 'cyan', 'white'];

function emitWindowsTerminal(t, theme) {
  const scheme = {
    name: `Aurora ${theme.name}`,
    background: t.background,
    foreground: t.foreground,
    cursorColor: t.cursor,
    selectionBackground: t.selection,
  };
  WT_NAMES.forEach((n, i) => {
    scheme[n] = t.ansi[i];
    scheme['bright' + n[0].toUpperCase() + n.slice(1)] = t.ansi[i + 8];
  });
  return JSON.stringify(scheme, null, 2) + '\n';
}

function emitGhostty(t) {
  const lines = [
    `background = ${t.background}`,
    `foreground = ${t.foreground}`,
    `cursor-color = ${t.cursor}`,
    `selection-background = ${t.selection}`,
  ];
  t.ansi.forEach((hex, i) => lines.push(`palette = ${i}=${hex}`));
  return lines.join('\n') + '\n';
}

const FORMATS = [
  { tool: 'iterm2', ext: 'itermcolors', emit: emitIterm },
  { tool: 'alacritty', ext: 'toml', emit: emitAlacritty },
  { tool: 'kitty', ext: 'conf', emit: emitKitty },
  { tool: 'wezterm', ext: 'toml', emit: emitWezterm },
  { tool: 'windows-terminal', ext: 'json', emit: emitWindowsTerminal },
  { tool: 'ghostty', ext: 'conf', emit: emitGhostty },
];

function main() {
  const { themes, ansiMapping } = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

  fs.rmSync(DIST, { recursive: true, force: true });
  for (const { tool } of FORMATS) {
    fs.mkdirSync(path.join(DIST, tool), { recursive: true });
  }

  let count = 0;
  for (const theme of themes) {
    const resolved = resolveTerminal(theme, ansiMapping);
    for (const { tool, ext, emit } of FORMATS) {
      const out = emit(resolved, theme);
      fs.writeFileSync(path.join(DIST, tool, `${theme.id}.${ext}`), out);
      count++;
    }
  }

  console.log(`Generated ${count} files for ${themes.length} themes across ${FORMATS.length} formats.`);
}

main();
