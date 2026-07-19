'use strict';

// Candela theme generator. Reads themes/candela-themes.json (the
// single source of truth) and writes build/<tool>/<theme-id>.<ext> for every
// terminal format. Zero runtime dependencies — runs on a stock Node install.
//
// build/ holds the source fragments and is wiped and rewritten on each run so
// output is deterministic and diffable. Packaging (e.g. the VS Code .vsix) turns
// those fragments into distributables under dist/ — see scripts/package-vscode.js.
// Neither build/ nor dist/ is committed.

const fs = require('fs');
const path = require('path');
const { normalizeHex, hexToFloat } = require('../lib/colors');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'themes/candela-themes.json');
const BUILD = path.join(ROOT, 'build');

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
// extension folder: one package.json contributing all 14 themes plus one
// color-theme JSON each. These are light themes, so the contribution uses
// uiTheme "vs" and each file declares "type": "light".

const cap = (s) => s[0].toUpperCase() + s.slice(1);

// Syntax scope table — the mapping from README.md ("How themes are generated").
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

const VSCODE_VERSION = '0.1.0';

// Ships only what the extension needs; keeps `vsce package` from bundling cruft.
const VSCODE_IGNORE = ['.vscode/**', '**/*.map', '.gitignore', 'vsc-extension-quickstart.md', ''].join('\n');

function vscodeReadme() {
  return [
    '# Candela Light Themes',
    '',
    '14 light color themes for tired eyes — low-glare, low-saturation, AAA body',
    'contrast. Built for people who prefer dark mode but find it uncomfortable',
    '(prescription lenses, astigmatism, glare sensitivity, general eye strain).',
    '',
    'After installing, open **Preferences: Color Theme** and pick any *Candela …* entry.',
    '',
    'Themes: Sepia Paper, Slate Mist, Sage, Solarized Lite, Blossom, Lagoon, Meadow,',
    'Apricot, Periwinkle, Ink & Coral, Graphite Mono, Tungsten, E-Ink Slate, Contrast Max.',
    '',
    '> Generated from the Candela source of truth — do not edit by hand.',
    '> TODO: no Marketplace icon yet (needs a 128px PNG asset).',
    '',
  ].join('\n');
}

function emitVSCode(themes, ansiMapping) {
  const dir = path.join(BUILD, 'vscode');
  const themesDir = path.join(dir, 'themes');
  fs.mkdirSync(themesDir, { recursive: true });

  const contributes = [];
  for (const theme of themes) {
    const file = `candela-${theme.id}-color-theme.json`;
    const { colors, tokenColors } = resolveEditor(theme, ansiMapping);
    const doc = {
      name: `Candela ${theme.name}`,
      type: 'light',
      colors,
      tokenColors,
    };
    fs.writeFileSync(path.join(themesDir, file), JSON.stringify(doc, null, 2) + '\n');
    contributes.push({
      label: `Candela ${theme.name}`,
      uiTheme: 'vs',
      path: `./themes/${file}`,
    });
  }

  // Placeholder until a real repo/publisher exists (task exclusion). vsce needs
  // repository/bugs/homepage present to package without warnings.
  const repoUrl = 'https://github.com/CHANGEME/candela-themes';
  const pkg = {
    name: 'candela-themes',
    displayName: 'Candela Light Themes',
    description: '14 light color themes for tired eyes — low-glare, low-saturation, AAA body contrast.',
    version: VSCODE_VERSION,
    publisher: 'candela',
    // icon: TODO — needs a 128px PNG asset. Left unset on purpose: pointing at a
    // missing file makes vsce fail. Add the field once an icon exists.
    engines: { vscode: '^1.70.0' },
    categories: ['Themes'],
    keywords: ['theme', 'light', 'color-theme', 'eye-strain', 'accessibility'],
    galleryBanner: { color: '#f4ece0', theme: 'light' },
    repository: { type: 'git', url: `${repoUrl}.git` },
    bugs: { url: `${repoUrl}/issues` },
    homepage: `${repoUrl}#readme`,
    license: 'MIT',
    contributes: { themes: contributes },
  };
  fs.writeFileSync(path.join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');

  fs.writeFileSync(path.join(dir, 'README.md'), vscodeReadme());
  fs.writeFileSync(path.join(dir, '.vscodeignore'), VSCODE_IGNORE);
  // vsce wants a LICENSE in the extension root; copy the repo's MIT license in.
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(dir, 'LICENSE'));

  return themes.length;
}

// --- JetBrains / IntelliJ plugin emitter -----------------------------------
// A JetBrains theme plugin: one .icls editor color scheme + one .theme.json UI
// theme per theme, plus a META-INF/plugin.xml registering every theme as a
// themeProvider extension. The emitted Gradle project packages this layout.
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
  lines.push(`<scheme name="Candela ${xmlEscape(theme.name)}" version="142" parent_scheme="Default">`);

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
    dark: false,
    editorScheme: `/themes/candela-${theme.id}.icls`,
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
        'HeaderTab.underlineColor': n(c.fn),
      },
      StatusBar: { background: n(c.surface), borderColor: n(c.border) },
    },
  };
  return JSON.stringify(doc, null, 2) + '\n';
}

function emitIntellijPluginXml(themes) {
  const providers = themes
    .map((t) => `    <themeProvider id="candela-${t.id}" path="/themes/candela-${t.id}.theme.json" />`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<idea-plugin>',
    '  <id>com.candela.themes</id>',
    '  <name>Candela Themes</name>',
    '  <version>0.1.0</version>',
    '  <vendor url="https://github.com/CHANGEME/candela-themes" email="CHANGEME@example.com">Candela</vendor>',
    '  <description><![CDATA[<p>Sixteen low-glare, low-saturation color themes for tired eyes, with AAA body-text contrast.</p>]]></description>',
    '  <change-notes><![CDATA[<p>Initial release with all sixteen Candela themes.</p>]]></change-notes>',
    '  <idea-version since-build="242" />',
    '  <depends>com.intellij.modules.platform</depends>',
    '  <extensions defaultExtensionNs="com.intellij">',
    providers,
    '  </extensions>',
    '</idea-plugin>',
    '',
  ].join('\n');
}

function emitIntellij(themes) {
  const intellijDir = path.join(BUILD, 'intellij');
  const resources = path.join(intellijDir, 'src/main/resources');
  const themesDir = path.join(resources, 'themes');
  const metaInf = path.join(resources, 'META-INF');
  fs.mkdirSync(themesDir, { recursive: true });
  fs.mkdirSync(metaInf, { recursive: true });

  for (const theme of themes) {
    fs.writeFileSync(path.join(themesDir, `candela-${theme.id}.icls`), emitIclsScheme(theme));
    fs.writeFileSync(path.join(themesDir, `candela-${theme.id}.theme.json`), emitIntellijTheme(theme));
  }
  fs.writeFileSync(path.join(metaInf, 'plugin.xml'), emitIntellijPluginXml(themes));
  fs.writeFileSync(path.join(intellijDir, 'settings.gradle.kts'), [
    'rootProject.name = "candela-themes-intellij"',
    '',
  ].join('\n'));
  fs.writeFileSync(path.join(intellijDir, 'build.gradle.kts'), [
    'plugins {',
    '    id("org.jetbrains.intellij.platform") version "2.18.1"',
    '}',
    '',
    'group = "com.candela"',
    'version = "0.1.0"',
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
  ].join('\n'));

  return themes.length;
}

// --- Zed emitter -----------------------------------------------------------
// Zed consumes a theme extension with an extension.toml manifest and a single
// theme-family JSON under themes/, with all themes as entries. The
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

function emitZed(themes, ansiMapping) {
  const dir = path.join(BUILD, 'zed');
  const themesDir = path.join(dir, 'themes');
  fs.mkdirSync(themesDir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'extension.toml'), [
    'id = "candela-themes-theme"',
    'name = "Candela Themes"',
    'version = "0.1.0"',
    'schema_version = 1',
    'authors = ["Candela <CHANGEME@example.com>"]',
    'description = "Light themes for tired eyes"',
    'repository = "https://github.com/CHANGEME/candela-themes"',
    '',
  ].join('\n'));
  const family = {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Candela',
    author: 'Candela',
    themes: themes.map((theme) => ({
      name: `Candela ${theme.name}`,
      appearance: 'light',
      style: zedStyle(theme, ansiMapping),
    })),
  };
  fs.writeFileSync(path.join(themesDir, 'candela.json'), JSON.stringify(family, null, 2) + '\n');
  return themes.length;
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

function emitSublime(themes) {
  const dir = path.join(BUILD, 'sublime');
  fs.mkdirSync(dir, { recursive: true });
  for (const theme of themes) {
    fs.writeFileSync(
      path.join(dir, `candela-${theme.id}.sublime-color-scheme`),
      emitSublimeScheme(theme),
    );
  }
  return themes.length;
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

function emitNvim(themes, ansiMapping) {
  const dir = path.join(BUILD, 'nvim');
  fs.mkdirSync(dir, { recursive: true });
  for (const theme of themes) {
    fs.writeFileSync(path.join(dir, `candela-${theme.id}.lua`), emitNvimTheme(theme, ansiMapping));
  }
  return themes.length;
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

function emitHelix(themes) {
  const dir = path.join(BUILD, 'helix');
  fs.mkdirSync(dir, { recursive: true });
  for (const theme of themes) {
    fs.writeFileSync(path.join(dir, `candela-${theme.id}.toml`), emitHelixTheme(theme));
  }
  return themes.length;
}

function main() {
  const { themes, ansiMapping } = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));

  fs.rmSync(BUILD, { recursive: true, force: true });
  for (const { tool } of FORMATS) {
    fs.mkdirSync(path.join(BUILD, tool), { recursive: true });
  }

  let count = 0;
  for (const theme of themes) {
    const resolved = resolveTerminal(theme, ansiMapping);
    for (const { tool, ext, emit } of FORMATS) {
      const out = emit(resolved, theme);
      fs.writeFileSync(path.join(BUILD, tool, `${theme.id}.${ext}`), out);
      count++;
    }
  }

  const vscodeCount = emitVSCode(themes, ansiMapping);
  const intellijCount = emitIntellij(themes);
  const zedCount = emitZed(themes, ansiMapping);
  const sublimeCount = emitSublime(themes);
  const nvimCount = emitNvim(themes, ansiMapping);
  const helixCount = emitHelix(themes);

  console.log(`Generated ${count} files for ${themes.length} themes across ${FORMATS.length} formats.`);
  console.log(`Generated build/vscode/ extension: package.json + ${vscodeCount} theme files.`);
  console.log(`Generated build/intellij/ plugin: plugin.xml + ${intellijCount} .icls + ${intellijCount} .theme.json.`);
  console.log(`Generated build/zed/ extension with ${zedCount} themes.`);
  console.log(`Generated build/sublime/ ${sublimeCount} .sublime-color-scheme files.`);
  console.log(`Generated build/nvim/ ${nvimCount} Lua colorschemes.`);
  console.log(`Generated build/helix/ ${helixCount} .toml themes.`);
}

main();
