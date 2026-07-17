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

// --- VS Code extension emitter ---------------------------------------------
// Unlike the terminal formats (one flat file per theme), VS Code needs a whole
// extension folder: one package.json contributing all 14 themes plus one
// color-theme JSON each. These are light themes, so the contribution uses
// uiTheme "vs" and each file declares "type": "light".

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Syntax scope table — the mapping from docs/design-handover/README.md.
const TOKEN_SCOPES = [
  { token: 'kw', scopes: ['keyword', 'storage'] },
  { token: 'str', scopes: ['string'] },
  { token: 'fn', scopes: ['entity.name.function', 'support.function'] },
  { token: 'num', scopes: ['constant.numeric', 'constant.language'] },
  { token: 'type', scopes: ['entity.name.type', 'entity.name.class', 'support.type'] },
  { token: 'builtin', scopes: ['support', 'variable.language', 'constant.other.symbol'] },
  { token: 'punct', scopes: ['punctuation', 'keyword.operator'] },
  { token: 'faint', scopes: ['comment'], fontStyle: 'italic' },
];

// Full workbench + syntax color set for one theme. UI mapping follows task 002:
// editor from surface/ink, chrome from bg/surface, borders from border, and the
// integrated terminal reuses the shared ansiMapping so it matches the terminal
// themes exactly.
function resolveEditor(theme, ansiMapping) {
  const c = theme.colors;
  const n = (hex) => normalizeHex(hex);
  const alpha = (hex, aa) => n(hex) + aa; // VS Code accepts #rrggbbaa

  const colors = {
    foreground: n(c.ink),
    focusBorder: n(c.border),
    'selection.background': n(c.selection),
    descriptionForeground: n(c.ink2),
    errorForeground: n(c.error),
    'widget.border': n(c.border),

    // Editor pane
    'editor.background': n(c.surface),
    'editor.foreground': n(c.ink),
    'editorLineNumber.foreground': n(c.ink2),
    'editorLineNumber.activeForeground': n(c.ink),
    'editorCursor.foreground': n(c.cursor),
    'editor.selectionBackground': n(c.selection),
    'editor.selectionHighlightBackground': alpha(c.selection, '80'),
    'editor.lineHighlightBackground': n(c.lineHighlight),
    'editor.lineHighlightBorder': n(c.lineHighlight),
    'editorIndentGuide.background1': n(c.border),
    'editorIndentGuide.activeBackground1': n(c.faint),
    'editorWhitespace.foreground': n(c.faint),
    'editorRuler.foreground': n(c.border),
    'editorError.foreground': n(c.error),
    'editorWarning.foreground': n(c.warning),
    'editorGutter.addedBackground': n(c.ok),
    'editorGutter.deletedBackground': n(c.error),
    'editorGutter.modifiedBackground': n(c.fn),
    'editorBracketMatch.background': alpha(c.selection, '80'),
    'editorBracketMatch.border': n(c.faint),

    // Editor widgets (find, suggest, hover)
    'editorWidget.background': n(c.bg),
    'editorWidget.border': n(c.border),
    'editorSuggestWidget.background': n(c.bg),
    'editorSuggestWidget.border': n(c.border),
    'editorSuggestWidget.selectedBackground': n(c.selection),
    'editorHoverWidget.background': n(c.bg),
    'editorHoverWidget.border': n(c.border),

    // Diffs
    'diffEditor.insertedTextBackground': alpha(c.ok, '22'),
    'diffEditor.removedTextBackground': alpha(c.error, '22'),

    // Activity bar
    'activityBar.background': n(c.bg),
    'activityBar.foreground': n(c.ink),
    'activityBar.inactiveForeground': n(c.faint),
    'activityBar.border': n(c.border),
    'activityBarBadge.background': n(c.fn),
    'activityBarBadge.foreground': n(c.surface),

    // Side bar
    'sideBar.background': n(c.bg),
    'sideBar.foreground': n(c.ink2),
    'sideBar.border': n(c.border),
    'sideBarTitle.foreground': n(c.ink),
    'sideBarSectionHeader.background': n(c.bg),
    'sideBarSectionHeader.foreground': n(c.ink),
    'sideBarSectionHeader.border': n(c.border),

    // Lists (explorer, suggestions)
    'list.activeSelectionBackground': n(c.selection),
    'list.activeSelectionForeground': n(c.ink),
    'list.inactiveSelectionBackground': n(c.lineHighlight),
    'list.hoverBackground': n(c.lineHighlight),
    'list.highlightForeground': n(c.fn),

    // Editor groups & tabs
    'editorGroup.border': n(c.border),
    'editorGroupHeader.tabsBackground': n(c.bg),
    'editorGroupHeader.tabsBorder': n(c.border),
    'tab.activeBackground': n(c.surface),
    'tab.activeForeground': n(c.ink),
    'tab.inactiveBackground': n(c.bg),
    'tab.inactiveForeground': n(c.ink2),
    'tab.border': n(c.border),
    'tab.activeBorder': n(c.fn),

    // Status bar
    'statusBar.background': n(c.surface),
    'statusBar.foreground': n(c.ink2),
    'statusBar.border': n(c.border),
    'statusBar.noFolderBackground': n(c.surface),
    'statusBar.debuggingBackground': n(c.warning),
    'statusBar.debuggingForeground': n(c.surface),

    // Title bar
    'titleBar.activeBackground': n(c.bg),
    'titleBar.activeForeground': n(c.ink),
    'titleBar.inactiveBackground': n(c.bg),
    'titleBar.inactiveForeground': n(c.faint),
    'titleBar.border': n(c.border),

    // Panel (terminal, problems, output)
    'panel.background': n(c.surface),
    'panel.border': n(c.border),
    'panelTitle.activeForeground': n(c.ink),
    'panelTitle.inactiveForeground': n(c.faint),
    'panelTitle.activeBorder': n(c.fn),

    // Integrated terminal
    'terminal.background': n(c.surface),
    'terminal.foreground': n(c.ink),
    'terminalCursor.foreground': n(c.cursor),
    'terminal.selectionBackground': n(c.selection),

    // Inputs, dropdowns, buttons, badges
    'input.background': n(c.surface),
    'input.foreground': n(c.ink),
    'input.border': n(c.border),
    'input.placeholderForeground': n(c.faint),
    'dropdown.background': n(c.surface),
    'dropdown.foreground': n(c.ink),
    'dropdown.border': n(c.border),
    'button.background': n(c.fn),
    'button.foreground': n(c.surface),
    'badge.background': n(c.fn),
    'badge.foreground': n(c.surface),

    // Scrollbar (translucent so it never hides content)
    'scrollbarSlider.background': alpha(c.faint, '55'),
    'scrollbarSlider.hoverBackground': alpha(c.faint, '88'),
    'scrollbarSlider.activeBackground': alpha(c.ink2, '88'),

    // Git decorations
    'gitDecoration.modifiedResourceForeground': n(c.warning),
    'gitDecoration.deletedResourceForeground': n(c.error),
    'gitDecoration.untrackedResourceForeground': n(c.ok),
    'gitDecoration.ignoredResourceForeground': n(c.faint),
  };

  const ansi = resolveAnsi(ansiMapping, c);
  ANSI_ORDER.forEach((name, i) => {
    colors['terminal.ansi' + cap(name)] = ansi[i];
    colors['terminal.ansiBright' + cap(name)] = ansi[i + 8];
  });

  const tokenColors = TOKEN_SCOPES.map(({ token, scopes, fontStyle }) => ({
    scope: scopes,
    settings: fontStyle
      ? { foreground: normalizeHex(c[token]), fontStyle }
      : { foreground: normalizeHex(c[token]) },
  }));

  return { colors, tokenColors };
}

function emitVSCode(themes, ansiMapping) {
  const dir = path.join(DIST, 'vscode');
  const themesDir = path.join(dir, 'themes');
  fs.mkdirSync(themesDir, { recursive: true });

  const contributes = [];
  for (const theme of themes) {
    const file = `aurora-${theme.id}-color-theme.json`;
    const { colors, tokenColors } = resolveEditor(theme, ansiMapping);
    const doc = {
      name: `Aurora ${theme.name}`,
      type: 'light',
      colors,
      tokenColors,
    };
    fs.writeFileSync(path.join(themesDir, file), JSON.stringify(doc, null, 2) + '\n');
    contributes.push({
      label: `Aurora ${theme.name}`,
      uiTheme: 'vs',
      path: `./themes/${file}`,
    });
  }

  const pkg = {
    name: 'aurora-themes',
    displayName: 'Aurora Light Themes',
    description: '14 light color themes for tired eyes — low-glare, low-saturation, AAA body contrast.',
    version: '0.1.0',
    publisher: 'aurora',
    engines: { vscode: '^1.70.0' },
    categories: ['Themes'],
    contributes: { themes: contributes },
  };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  return themes.length;
}

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

  const vscodeCount = emitVSCode(themes, ansiMapping);

  console.log(`Generated ${count} files for ${themes.length} themes across ${FORMATS.length} formats.`);
  console.log(`Generated dist/vscode/ extension: package.json + ${vscodeCount} theme files.`);
}

main();
