// Candela theme generator. Reads themes/candela-themes.json (the
// single source of truth) and writes build/<tool>/<theme-id>.<ext> for every
// terminal format. Zero runtime dependencies — runs on a stock Node install.
//
// build/ holds the source fragments and is wiped and rewritten on each run so
// output is deterministic and diffable. Packaging (e.g. the VS Code .vsix) turns
// those fragments into distributables under dist/ — see scripts/package-vscode.js.
// Neither build/ nor dist/ is committed.

import { normalizeHex, hexToFloat } from './colors.js';

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
    name: `Candela ${theme.name}`,
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
// extension folder: one package.json contributing all themes plus one
// color-theme JSON each. Each contribution follows the theme's mode.

const cap = (s) => s[0].toUpperCase() + s.slice(1);

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
    'icon.foreground': n(c.ink2),
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
    'agents.background': n(c.bg),
    'agentsPanel.background': n(c.surface),
    'agentsPanel.foreground': n(c.ink),
    'agentsPanel.border': n(c.border),

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

// Fallback for single-theme app exports; the packaged family threads the root
// package.json version through emitFullFamily so `npm version` drives every manifest.
const DEFAULT_VERSION = '0.1.0';
const REPO_URL = 'https://github.com/schovi/candela-themes';
const DESCRIPTION =
  'Candela is a family of color themes tuned for long, comfortable coding sessions. ' +
  'Low-glare backgrounds, desaturated accents, and WCAG-AA contrast throughout — ' +
  'the same palette across your editor and terminal.';

// Ships only what the extension needs; keeps `vsce package` from bundling cruft.
const VSCODE_IGNORE = ['.vscode/**', '**/*.map', '.gitignore', 'vsc-extension-quickstart.md', ''].join('\n');

function vscodeReadme() {
  return [
    '# Candela Themes',
    '',
    DESCRIPTION,
    '',
    'After installing, open **Preferences: Color Theme** and pick any *Candela …* entry.',
    '',
    '> Generated from the Candela source of truth — do not edit by hand.',
    '',
  ].join('\n');
}

function sublimeReadme() {
  return [
    '# Candela Themes for Sublime Text',
    '',
    'Candela includes 14 light color schemes for tired eyes and two dark companions.',
    'Every scheme uses low-glare backgrounds, desaturated accents, and accessible contrast.',
    '',
    'After installing, choose a Candela scheme from **Preferences > Select Color Scheme**.',
    '',
    'Generated from the Candela source of truth. Do not edit these files by hand.',
    '',
  ].join('\n');
}

function nvimReadme() {
  return [
    '# Candela Themes for Neovim',
    '',
    'Candela includes 14 light colorschemes for tired eyes and two dark companions.',
    'Every colorscheme is self-contained and requires no Neovim plugins.',
    '',
    'Extract the release archive, then install that directory with your plugin manager.',
    'For lazy.nvim:',
    '',
    '```lua',
    "{ dir = '/path/to/candela-themes-nvim' }",
    '```',
    '',
    'For a manual install, copy `colors/` into a directory on your Neovim runtimepath.',
    'Then run `:colorscheme candela-sepia-paper` (or another Candela theme id).',
    '',
    'Generated from the Candela source of truth. Do not edit these files by hand.',
    '',
  ].join('\n');
}

// --- JetBrains / IntelliJ plugin emitter -----------------------------------
// A JetBrains theme plugin: one .icls editor color scheme + one .theme.json UI
// theme per theme, plus a META-INF/plugin.xml registering all themes as
// themeProvider extensions. Layout under src/main/resources/ is what a Gradle
// `buildPlugin` consumes (Gradle wiring itself is out of scope).
//
// Two hex conventions live here: .icls stores colors as 6-digit hex WITHOUT the
// leading '#'; .theme.json uses ordinary '#rrggbb'. Attribute keys below are the
// standard IntelliJ TextAttributesKey / ColorKey names.

const xmlEscape = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// General editor colors -> .icls <colors> option names. From task spec:
// caret=cursor, caret row=lineHighlight, selection=selection, line number=ink2,
// gutter/indent from border. (bg/fg live in the TEXT attribute, below.)
const ICLS_GENERAL = [
  ['CARET_COLOR', 'cursor'],
  ['CARET_ROW_COLOR', 'lineHighlight'],
  ['SELECTION_BACKGROUND', 'selection'],
  ['LINE_NUMBERS_COLOR', 'ink2'],
  ['GUTTER_BACKGROUND', 'border'],
  ['INDENT_GUIDE', 'border'],
];

// Syntax TextAttributes -> Candela token, foreground only.
const ICLS_SYNTAX = [
  ['DEFAULT_KEYWORD', 'kw'],
  ['DEFAULT_STRING', 'str'],
  ['DEFAULT_FUNCTION_DECLARATION', 'fn'],
  ['DEFAULT_NUMBER', 'num'],
  ['DEFAULT_CLASS_NAME', 'type'],
  ['DEFAULT_CONSTANT', 'builtin'],
  ['DEFAULT_METADATA', 'builtin'],
  ['DEFAULT_OPERATION_SIGN', 'punct'],
  ['DEFAULT_BRACES', 'punct'],
  ['DEFAULT_DOT', 'punct'],
  ['DEFAULT_LINE_COMMENT', 'faint'],
  ['DEFAULT_BLOCK_COMMENT', 'faint'],
];

// Diagnostics -> attribute key. EFFECT_TYPE 2 is the wavy underline IntelliJ
// uses for errors/warnings.
const ICLS_DIAGNOSTICS = [
  ['ERRORS_ATTRIBUTES', 'error'],
  ['WARNING_ATTRIBUTES', 'warning'],
];

function emitIclsScheme(theme) {
  const c = theme.colors;
  const h = (hex) => normalizeHex(hex).slice(1); // .icls drops the leading '#'
  const lines = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  const parentScheme = theme.mode === 'dark' ? 'Darcula' : 'Default';
  lines.push(`<scheme name="Candela ${xmlEscape(theme.name)}" version="142" parent_scheme="${parentScheme}">`);

  lines.push('  <colors>');
  for (const [name, token] of ICLS_GENERAL) {
    lines.push(`    <option name="${name}" value="${h(c[token])}" />`);
  }
  lines.push('  </colors>');

  lines.push('  <attributes>');
  lines.push('    <option name="TEXT">');
  lines.push('      <value>');
  lines.push(`        <option name="FOREGROUND" value="${h(c.ink)}" />`);
  lines.push(`        <option name="BACKGROUND" value="${h(c.surface)}" />`);
  lines.push('      </value>');
  lines.push('    </option>');
  for (const [name, token] of ICLS_SYNTAX) {
    lines.push(`    <option name="${name}">`);
    lines.push('      <value>');
    lines.push(`        <option name="FOREGROUND" value="${h(c[token])}" />`);
    lines.push('      </value>');
    lines.push('    </option>');
  }
  for (const [name, token] of ICLS_DIAGNOSTICS) {
    lines.push(`    <option name="${name}">`);
    lines.push('      <value>');
    lines.push(`        <option name="EFFECT_COLOR" value="${h(c[token])}" />`);
    lines.push(`        <option name="ERROR_STRIPE_COLOR" value="${h(c[token])}" />`);
    lines.push('        <option name="EFFECT_TYPE" value="2" />');
    lines.push('      </value>');
    lines.push('    </option>');
  }
  lines.push('  </attributes>');
  lines.push('</scheme>');
  return lines.join('\n') + '\n';
}

function emitIntellijTheme(theme) {
  const c = theme.colors;
  const n = (hex) => normalizeHex(hex);
  const doc = {
    name: `Candela ${theme.name}`,
    author: 'Candela',
    dark: theme.mode === 'dark',
    editorScheme: `/themes/candela-${theme.id}.xml`,
    ui: {
      '*': {
        background: n(c.bg),
        foreground: n(c.ink),
        infoForeground: n(c.ink2),
        disabledForeground: n(c.faint),
        selectionBackground: n(c.selection),
        selectionForeground: n(c.ink),
        borderColor: n(c.border),
        separatorColor: n(c.border),
        focusColor: n(c.fn),
      },
      Editor: { background: n(c.surface) },
      EditorTabs: {
        background: n(c.bg),
        underlinedTabBackground: n(c.surface),
        underlineColor: n(c.fn),
      },
      ToolWindow: {
        'Header.background': n(c.surface),
        'Header.inactiveBackground': n(c.surface),
        'HeaderTab.underlineColor': n(c.fn),
        Button: {
          selectedBackground: n(c.selection),
          selectedForeground: n(c.ink),
          hoverBackground: n(c.lineHighlight),
        },
      },
      StatusBar: { background: n(c.surface), borderColor: n(c.border) },
    },
  };
  return JSON.stringify(doc, null, 2) + '\n';
}

function emitIntellijPluginXml(themes, version = DEFAULT_VERSION) {
  const providers = themes
    .map((t) => `    <themeProvider id="candela-${t.id}" path="/themes/candela-${t.id}.theme.json" />`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<idea-plugin>',
    '  <id>com.candela.themes</id>',
    '  <name>Candela Themes</name>',
    `  <version>${version}</version>`,
    `  <vendor url="${REPO_URL}">Candela</vendor>`,
    `  <description><![CDATA[${DESCRIPTION}]]></description>`,
    '  <change-notes><![CDATA[Initial release: the Candela theme set for JetBrains IDEs.]]></change-notes>',
    '  <idea-version since-build="223" />',
    '  <depends>com.intellij.modules.platform</depends>',
    '  <extensions defaultExtensionNs="com.intellij">',
    providers,
    '  </extensions>',
    '</idea-plugin>',
    '',
  ].join('\n');
}

// --- Zed emitter -----------------------------------------------------------
// Zed consumes a single theme-family JSON: one file, all themes as entries
// with appearance from each theme's mode and a style{} block. The
// integrated terminal ANSI keys reuse the shared ansiMapping so terminal and
// editor stay in sync, exactly like VS Code.

// Zed syntax highlight name -> Candela token, following the README scope roles.
const ZED_SYNTAX = [
  ['keyword', 'kw'],
  ['string', 'str'],
  ['string.special', 'str'],
  ['string.escape', 'str'],
  ['function', 'fn'],
  ['function.method', 'fn'],
  ['number', 'num'],
  ['boolean', 'num'],
  ['constant', 'num'],
  ['type', 'type'],
  ['constructor', 'type'],
  ['variable.special', 'builtin'],
  ['attribute', 'builtin'],
  ['operator', 'punct'],
  ['punctuation', 'punct'],
  ['punctuation.bracket', 'punct'],
  ['punctuation.delimiter', 'punct'],
  ['comment', 'faint'],
  ['comment.doc', 'faint'],
];

// Zed's ANSI style keys: black..white plus bright_ variants, in slot order.
const ZED_ANSI = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'];

function zedStyle(theme, ansiMapping) {
  const c = theme.colors;
  const n = (hex) => normalizeHex(hex);
  const style = {
    background: n(c.bg),
    'surface.background': n(c.surface),
    'elevated_surface.background': n(c.surface),
    border: n(c.border),
    'border.variant': n(c.border),
    text: n(c.ink),
    'text.muted': n(c.ink2),
    'text.placeholder': n(c.faint),
    'editor.foreground': n(c.ink),
    'editor.background': n(c.surface),
    'editor.gutter.background': n(c.surface),
    'editor.line_number': n(c.ink2),
    'editor.active_line_number': n(c.ink),
    'editor.active_line.background': n(c.lineHighlight),
    'editor.document_highlight.read_background': n(c.selection),
    'terminal.background': n(c.surface),
    'terminal.foreground': n(c.ink),
    error: n(c.error),
    warning: n(c.warning),
    success: n(c.ok),
    players: [{ cursor: n(c.cursor), selection: n(c.selection), background: n(c.cursor) }],
  };

  const ansi = resolveAnsi(ansiMapping, c);
  ZED_ANSI.forEach((name, i) => {
    style['terminal.ansi.' + name] = ansi[i];
    style['terminal.ansi.bright_' + name] = ansi[i + 8];
  });

  const syntax = {};
  for (const [name, token] of ZED_SYNTAX) {
    syntax[name] = { color: n(c[token]) };
  }
  style.syntax = syntax;
  return style;
}

// --- Sublime Text emitter --------------------------------------------------
// One .sublime-color-scheme (JSON) per theme: variables hold the palette,
// globals wire the editor chrome, rules[] map the same TextMate scopes as VS
// Code (reusing TOKEN_SCOPES) to those variables.

function emitSublimeScheme(theme) {
  const c = theme.colors;
  const variables = {};
  for (const [token, hex] of Object.entries(c)) {
    variables[token] = normalizeHex(hex);
  }
  const doc = {
    name: `Candela ${theme.name}`,
    author: 'Candela',
    variables,
    globals: {
      background: 'var(surface)',
      foreground: 'var(ink)',
      caret: 'var(cursor)',
      line_highlight: 'var(lineHighlight)',
      selection: 'var(selection)',
      gutter: 'var(bg)',
      gutter_foreground: 'var(ink2)',
      invisibles: 'var(faint)',
    },
    rules: TOKEN_SCOPES.map(({ token, scopes, fontStyle }) => {
      const rule = { scope: scopes.join(', '), foreground: `var(${token})` };
      if (fontStyle) rule.font_style = fontStyle;
      return rule;
    }),
  };
  return JSON.stringify(doc, null, 2) + '\n';
}

// --- Neovim emitter --------------------------------------------------------
// One self-contained Lua colorscheme per theme (dist/nvim/candela-<id>.lua).
// Chosen over a base16 YAML: a Lua colorscheme drops into runtimepath and loads
// with `:colorscheme candela-<id>` and zero plugins, where a base16 YAML needs
// the base16 builder/plugin to apply at all. It sets legacy highlight groups
// (Neovim links Treesitter groups to these by default) plus the 16
// terminal_color_N globals from the shared ansiMapping.

// Legacy highlight group -> Candela token (foreground). Comments get italic.
const NVIM_SYNTAX = [
  ['Comment', 'faint', 'italic'],
  ['Constant', 'num'],
  ['String', 'str'],
  ['Character', 'str'],
  ['Number', 'num'],
  ['Boolean', 'num'],
  ['Identifier', 'ink'],
  ['Function', 'fn'],
  ['Statement', 'kw'],
  ['Keyword', 'kw'],
  ['Operator', 'punct'],
  ['PreProc', 'builtin'],
  ['Type', 'type'],
  ['Special', 'builtin'],
  ['Delimiter', 'punct'],
  ['Todo', 'kw'],
  ['Error', 'error'],
  ['WarningMsg', 'warning'],
];

function luaHl(group, opts) {
  const parts = Object.entries(opts).map(([k, v]) =>
    typeof v === 'boolean' ? `${k} = ${v}` : `${k} = '${v}'`,
  );
  return `hi('${group}', { ${parts.join(', ')} })`;
}

function emitNvimTheme(theme, ansiMapping) {
  const c = theme.colors;
  const n = (hex) => normalizeHex(hex);
  const lines = [
    `-- Candela ${theme.name} — generated by scripts/generate.js, do not edit.`,
    "vim.cmd('highlight clear')",
    "if vim.fn.exists('syntax_on') == 1 then vim.cmd('syntax reset') end",
    "vim.o.background = 'light'",
    `vim.g.colors_name = 'candela-${theme.id}'`,
    '',
    'local hi = function(group, opts) vim.api.nvim_set_hl(0, group, opts) end',
    '',
    luaHl('Normal', { fg: n(c.ink), bg: n(c.bg) }),
    luaHl('NormalFloat', { fg: n(c.ink), bg: n(c.surface) }),
    luaHl('LineNr', { fg: n(c.ink2) }),
    luaHl('CursorLine', { bg: n(c.lineHighlight) }),
    luaHl('CursorLineNr', { fg: n(c.ink) }),
    luaHl('Cursor', { fg: n(c.bg), bg: n(c.cursor) }),
    luaHl('Visual', { bg: n(c.selection) }),
    luaHl('VertSplit', { fg: n(c.border) }),
    luaHl('WinSeparator', { fg: n(c.border) }),
    luaHl('Pmenu', { fg: n(c.ink), bg: n(c.surface) }),
    luaHl('PmenuSel', { bg: n(c.selection) }),
    luaHl('StatusLine', { fg: n(c.ink), bg: n(c.surface) }),
    luaHl('DiffAdd', { fg: n(c.ok) }),
    luaHl('DiffDelete', { fg: n(c.error) }),
    luaHl('DiffChange', { fg: n(c.warning) }),
  ];
  for (const [group, token, style] of NVIM_SYNTAX) {
    const opts = { fg: n(c[token]) };
    if (style) opts[style] = true;
    lines.push(luaHl(group, opts));
  }

  lines.push('');
  const ansi = resolveAnsi(ansiMapping, c);
  ansi.forEach((hex, i) => lines.push(`vim.g.terminal_color_${i} = '${hex}'`));
  lines.push('');
  return lines.join('\n');
}

// --- Helix emitter ---------------------------------------------------------
// One theme TOML per theme: top-level scope keys reference named palette
// entries, and a [palette] table at the bottom carries every Candela token as a
// hex value. Scope keys follow the README roles.

// Helix scope key -> Candela palette name. Inline-table scopes (ui.*) are handled
// separately; these are plain foreground scopes.
const HELIX_SYNTAX = [
  ['keyword', 'kw'],
  ['keyword.storage', 'kw'],
  ['string', 'str'],
  ['constant.character', 'str'],
  ['function', 'fn'],
  ['function.method', 'fn'],
  ['constant', 'num'],
  ['constant.numeric', 'num'],
  ['type', 'type'],
  ['type.builtin', 'type'],
  ['constructor', 'type'],
  ['variable.builtin', 'builtin'],
  ['variable.other.member', 'builtin'],
  ['label', 'builtin'],
  ['punctuation', 'punct'],
  ['operator', 'punct'],
  ['comment', 'faint'],
];

function emitHelixTheme(theme) {
  const c = theme.colors;
  const lines = [`# Candela ${theme.name} — generated by scripts/generate.js, do not edit.`];

  lines.push('"ui.background" = { bg = "bg" }');
  lines.push('"ui.text" = "ink"');
  lines.push('"ui.window" = { fg = "border" }');
  lines.push('"ui.linenr" = "ink2"');
  lines.push('"ui.linenr.selected" = "ink"');
  lines.push('"ui.cursor" = { fg = "bg", bg = "cursor" }');
  lines.push('"ui.cursor.primary" = { fg = "bg", bg = "cursor" }');
  lines.push('"ui.selection" = { bg = "selection" }');
  lines.push('"ui.cursorline" = { bg = "lineHighlight" }');
  lines.push('"ui.statusline" = { fg = "ink", bg = "surface" }');
  lines.push('"ui.popup" = { bg = "surface" }');
  lines.push('"ui.menu" = { fg = "ink", bg = "surface" }');
  lines.push('"ui.help" = { fg = "ink", bg = "surface" }');
  lines.push('"ui.virtual.whitespace" = "faint"');
  lines.push('"ui.virtual.ruler" = { bg = "border" }');
  for (const [scope, token] of HELIX_SYNTAX) {
    lines.push(`"${scope}" = "${token}"`);
  }
  lines.push('"diagnostic.error" = "error"');
  lines.push('"diagnostic.warning" = "warning"');
  lines.push('error = "error"');
  lines.push('warning = "warning"');
  lines.push('hint = "faint"');
  lines.push('info = "fn"');

  lines.push('');
  lines.push('[palette]');
  for (const [token, hex] of Object.entries(c)) {
    lines.push(`${token} = "${normalizeHex(hex)}"`);
  }
  lines.push('');
  return lines.join('\n');
}

const file = (path, content) => ({ path, content });

function terminalFiles(theme, ansiMapping, tool, ext, emit) {
  return { files: [file(`candela-${theme.id}.${ext}`, emit(resolveTerminal(theme, ansiMapping), theme))] };
}

function vscodeThemeDocument(theme, ansiMapping) {
  const { colors, tokenColors } = resolveEditor(theme, ansiMapping);
  return {
    name: `Candela ${theme.name}`,
    type: theme.mode,
    colors,
    tokenColors,
  };
}

function vscodePackage(themes, version = DEFAULT_VERSION) {
  const repoUrl = REPO_URL;
  return {
    name: 'candela-themes',
    displayName: 'Candela Themes',
    description: DESCRIPTION,
    version,
    publisher: 'candela',
    engines: { vscode: '^1.70.0' },
    categories: ['Themes'],
    keywords: ['theme', 'light', 'color-theme', 'eye-strain', 'accessibility'],
    galleryBanner: { color: '#f4ece0', theme: 'light' },
    repository: { type: 'git', url: `${repoUrl}.git` },
    bugs: { url: `${repoUrl}/issues` },
    homepage: `${repoUrl}#readme`,
    license: 'MIT',
    contributes: {
      themes: themes.map((theme) => ({
        label: `Candela ${theme.name}`,
        uiTheme: theme.mode === 'dark' ? 'vs-dark' : 'vs',
        path: `./themes/candela-${theme.id}-color-theme.json`,
      })),
    },
  };
}

function emitVscodeTheme(theme, ansiMapping) {
  const themePath = `themes/candela-${theme.id}-color-theme.json`;
  return {
    files: [
      file(themePath, JSON.stringify(vscodeThemeDocument(theme, ansiMapping), null, 2) + '\n'),
      file('package.json', JSON.stringify(vscodePackage([theme]), null, 2) + '\n'),
      file('.vscodeignore', VSCODE_IGNORE),
    ],
  };
}

function emitIntellijThemePackage(theme) {
  const themeJson = JSON.parse(emitIntellijTheme(theme));
  themeJson.dark = theme.mode === 'dark';
  return {
    files: [
      file('settings.gradle.kts', `pluginManagement { repositories { gradlePluginPortal(); mavenCentral() } }\nrootProject.name = "candela-${theme.id}"\n`),
      file('build.gradle.kts', [
        'plugins {',
        '  java',
        '  id("org.jetbrains.intellij") version "1.17.4"',
        '}',
        '',
        'group = "com.candela.themes"',
        'version = "0.1.0"',
        '',
        'repositories { mavenCentral() }',
        '',
        'intellij {',
        '  version.set("2022.3")',
        '  type.set("IC")',
        '}',
        '',
      ].join('\n')),
      file(`src/main/resources/themes/candela-${theme.id}.xml`, emitIclsScheme(theme)),
      file(`src/main/resources/themes/candela-${theme.id}.icls`, emitIclsScheme(theme)),
      file(`src/main/resources/themes/candela-${theme.id}.theme.json`, JSON.stringify(themeJson, null, 2) + '\n'),
      file('src/main/resources/META-INF/plugin.xml', emitIntellijPluginXml([theme])),
    ],
  };
}

function emitZedTheme(theme, ansiMapping) {
  const family = {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Candela',
    author: 'Candela',
    themes: [{
      name: `Candela ${theme.name}`,
      appearance: theme.mode,
      style: zedStyle(theme, ansiMapping),
    }],
  };
  return { files: [file('candela.json', JSON.stringify(family, null, 2) + '\n')] };
}

function emitNvimPackage(theme, ansiMapping) {
  const content = emitNvimTheme(theme, ansiMapping).replace(
    "vim.o.background = 'light'",
    `vim.o.background = '${theme.mode}'`,
  );
  return { files: [file(`candela-${theme.id}.lua`, content)] };
}

export const FORMAT_EMITTERS = [
  { tool: 'iterm2', label: 'iTerm2', emit: (theme, ansiMapping) => terminalFiles(theme, ansiMapping, 'iterm2', 'itermcolors', emitIterm) },
  { tool: 'alacritty', label: 'Alacritty', emit: (theme, ansiMapping) => terminalFiles(theme, ansiMapping, 'alacritty', 'toml', emitAlacritty) },
  { tool: 'kitty', label: 'Kitty', emit: (theme, ansiMapping) => terminalFiles(theme, ansiMapping, 'kitty', 'conf', emitKitty) },
  { tool: 'wezterm', label: 'WezTerm', emit: (theme, ansiMapping) => terminalFiles(theme, ansiMapping, 'wezterm', 'toml', emitWezterm) },
  { tool: 'windows-terminal', label: 'Windows Terminal', emit: (theme, ansiMapping) => terminalFiles(theme, ansiMapping, 'windows-terminal', 'json', emitWindowsTerminal) },
  { tool: 'ghostty', label: 'Ghostty', emit: (theme, ansiMapping) => terminalFiles(theme, ansiMapping, 'ghostty', 'conf', emitGhostty) },
  { tool: 'vscode', label: 'VS Code', emit: emitVscodeTheme },
  { tool: 'intellij', label: 'IntelliJ', emit: emitIntellijThemePackage },
  { tool: 'zed', label: 'Zed', emit: emitZedTheme },
  { tool: 'sublime', label: 'Sublime Text', emit: (theme) => ({ files: [file(`candela-${theme.id}.sublime-color-scheme`, emitSublimeScheme(theme))] }) },
  { tool: 'nvim', label: 'Neovim', emit: emitNvimPackage },
  { tool: 'helix', label: 'Helix', emit: (theme) => ({ files: [file(`candela-${theme.id}.toml`, emitHelixTheme(theme))] }) },
];

const INSTALL_STEPS = {
  iterm2: 'Open Settings → Profiles → Colors, choose Color Presets… → Import…, then select the imported preset.',
  alacritty: (theme) => `Save \`${theme.id}.toml\` as \`~/.config/alacritty/themes/${theme.id}.toml\`, then add \`[general]\` followed by \`import = ["~/.config/alacritty/themes/${theme.id}.toml"]\` to \`~/.config/alacritty/alacritty.toml\`.`,
  kitty: (theme) => `Save \`${theme.id}.conf\` as \`~/.config/kitty/themes/${theme.id}.conf\`, then add \`include themes/${theme.id}.conf\` to \`~/.config/kitty/kitty.conf\` and restart Kitty.`,
  wezterm: (theme) => `Save \`${theme.id}.toml\` as \`~/.config/wezterm/colors/${theme.id}.toml\`, then set \`config.color_scheme = "${theme.id}"\` in \`~/.wezterm.lua\` and restart WezTerm.`,
  'windows-terminal': 'Open Windows Terminal settings JSON and add the exported object to the schemes array.',
  ghostty: (theme) => `Save \`${theme.id}.conf\` as \`~/.config/ghostty/themes/${theme.id}.conf\`, then add \`config-file = themes/${theme.id}.conf\` to \`~/.config/ghostty/config\` and restart Ghostty.`,
  vscode: 'Copy this folder into your VS Code extensions directory, reload VS Code, then choose the theme from Preferences: Color Theme.',
  intellij: 'Run `gradle buildPlugin` in this folder, then open Settings → Plugins → ⚙ → Install Plugin from Disk… and select the zip under `build/distributions/`. Restart the IDE and choose the theme under Settings → Appearance & Behavior → Appearance.',
  zed: 'Copy candela.json into the Zed themes directory, restart Zed, then select the theme.',
  sublime: 'Copy the .sublime-color-scheme file into your Sublime Text Packages/User directory, then select it from Preferences → Select Color Scheme.',
  nvim: 'Copy the Lua file into colors/ on your Neovim runtime path, then run :colorscheme with its filename (without .lua).',
  helix: 'Copy the TOML file into the Helix themes directory, then set theme to its filename (without .toml) in config.toml.',
};

export function installReadme(tool, theme) {
  const format = FORMAT_EMITTERS.find((candidate) => candidate.tool === tool);
  if (!format) throw new Error(`Unknown export format: ${tool}`);
  const instruction = INSTALL_STEPS[tool];
  const steps = typeof instruction === 'function' ? instruction(theme) : instruction;
  return `# ${theme.name} for ${format.label}\n\n${steps}\n\nGenerated by Candela Themes.\n`;
}

export function emitFullFamily(themes, ansiMapping, licenseContent, iconContent, version = DEFAULT_VERSION) {
  const files = [];
  for (const theme of themes) {
    const terminal = resolveTerminal(theme, ansiMapping);
    for (const { tool, ext, emit } of FORMATS) {
      files.push(file(`${tool}/candela-${theme.id}.${ext}`, emit(terminal, theme)));
    }
  }

  const contributes = [];
  for (const theme of themes) {
    const themeFile = `candela-${theme.id}-color-theme.json`;
    const { colors, tokenColors } = resolveEditor(theme, ansiMapping);
    const doc = { name: `Candela ${theme.name}`, type: theme.mode, colors, tokenColors };
    files.push(file(`vscode/themes/${themeFile}`, JSON.stringify(doc, null, 2) + '\n'));
    contributes.push({
      label: `Candela ${theme.name}`,
      uiTheme: theme.mode === 'dark' ? 'vs-dark' : 'vs',
      path: `./themes/${themeFile}`,
    });
  }
  const vscodeFamilyPackage = vscodePackage(themes, version);
  vscodeFamilyPackage.contributes.themes = contributes;
  vscodeFamilyPackage.icon = 'icon.png';
  files.push(file('vscode/package.json', JSON.stringify(vscodeFamilyPackage, null, 2) + '\n'));
  files.push(file('vscode/README.md', vscodeReadme()));
  files.push(file('vscode/.vscodeignore', VSCODE_IGNORE));
  files.push(file('vscode/LICENSE', licenseContent));
  files.push(file('vscode/icon.png', iconContent));

  for (const theme of themes) {
    // Same scheme XML under two extensions: the plugin's theme.json editorScheme
    // only loads `.xml`, while IntelliJ's manual Import Scheme dialog only accepts `.icls`.
    const scheme = emitIclsScheme(theme);
    files.push(file(`intellij/src/main/resources/themes/candela-${theme.id}.xml`, scheme));
    files.push(file(`intellij/src/main/resources/themes/candela-${theme.id}.icls`, scheme));
    files.push(file(`intellij/src/main/resources/themes/candela-${theme.id}.theme.json`, emitIntellijTheme(theme)));
  }
  files.push(file('intellij/src/main/resources/META-INF/plugin.xml', emitIntellijPluginXml(themes, version)));
  files.push(file('intellij/settings.gradle.kts', 'rootProject.name = "candela-themes-intellij"\n'));
  files.push(file('intellij/build.gradle.kts', [
    'plugins {',
    '    id("org.jetbrains.intellij.platform") version "2.18.1"',
    '}',
    '',
    'group = "com.candela"',
    `version = "${version}"`,
    '',
    'repositories {',
    '    mavenCentral()',
    '    intellijPlatform {',
    '        defaultRepositories()',
    '    }',
    '}',
    '',
    'dependencies {',
    '    intellijPlatform {',
    '        intellijIdeaCommunity("2024.2.6")',
    '    }',
    '}',
    '',
  ].join('\n')));

  const zedFamily = {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Candela',
    author: 'Candela',
    themes: themes.map((theme) => ({ name: `Candela ${theme.name}`, appearance: theme.mode, style: zedStyle(theme, ansiMapping) })),
  };
  files.push(file('zed/extension.toml', [
    'id = "candela-themes"',
    'name = "Candela Themes"',
    `version = "${version}"`,
    'schema_version = 1',
    'authors = ["Candela"]',
    `description = ${JSON.stringify(DESCRIPTION)}`,
    `repository = "${REPO_URL}"`,
    '',
  ].join('\n')));
  files.push(file('zed/themes/candela.json', JSON.stringify(zedFamily, null, 2) + '\n'));
  for (const theme of themes) {
    files.push(file(`sublime/candela-${theme.id}.sublime-color-scheme`, emitSublimeScheme(theme)));
    const nvimTheme = emitNvimTheme(theme, ansiMapping).replace(
      "vim.o.background = 'light'",
      `vim.o.background = '${theme.mode}'`,
    );
    files.push(file(`nvim/colors/candela-${theme.id}.lua`, nvimTheme));
    files.push(file(`helix/candela-${theme.id}.toml`, emitHelixTheme(theme)));
  }
  files.push(file('sublime/README.md', sublimeReadme()));
  files.push(file('sublime/messages.json', JSON.stringify({ install: 'messages/install.txt' }, null, 2) + '\n'));
  files.push(file('sublime/messages/install.txt', 'Candela is installed. Choose a scheme from Preferences > Select Color Scheme.\n'));
  files.push(file('nvim/README.md', nvimReadme()));
  return { files };
}
