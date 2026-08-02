// JetBrains / IntelliJ plugin emitter.
// A JetBrains theme plugin: one .icls editor color scheme + one .theme.json UI
// theme per theme, plus a META-INF/plugin.xml registering all themes as
// themeProvider extensions. Layout under src/main/resources/ is what a Gradle
// `buildPlugin` consumes.
//
// Two hex conventions live here: .icls stores colors as 6-digit hex WITHOUT the
// leading '#'; .theme.json uses ordinary '#rrggbb'. Attribute keys below are the
// standard IntelliJ TextAttributesKey / ColorKey names.

import { normalizeHex } from '../colors.js';
import { DESCRIPTION } from '../copy.js';
import { n, file, DEFAULT_VERSION, HOMEPAGE_URL } from './shared.js';
import { whyHtml, customizeHtml } from './readmes.js';

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

export function emitIclsScheme(theme) {
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

export function emitIntellijTheme(theme) {
  const c = theme.colors;
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

export function emitIntellijPluginXml(themes, version = DEFAULT_VERSION) {
  const providers = themes
    .map((t) => `    <themeProvider id="candela-${t.id}" path="/themes/candela-${t.id}.theme.json" />`)
    .join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<idea-plugin>',
    '  <id>com.candela.themes</id>',
    '  <name>Candela Themes</name>',
    `  <version>${version}</version>`,
    `  <vendor url="${HOMEPAGE_URL}">Candela</vendor>`,
    `  <description><![CDATA[<p>${DESCRIPTION}</p>${whyHtml}${customizeHtml}]]></description>`,
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

// The Gradle wiring `buildPlugin` needs. Identical for the single-theme export
// and the packaged family apart from the project name and version.
export function intellijGradleFiles(rootName, version) {
  return [
    file('settings.gradle.kts', `rootProject.name = "${rootName}"\n`),
    file('build.gradle.kts', [
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
    ].join('\n')),
  ];
}

// Same scheme XML under two extensions: the plugin's theme.json editorScheme
// only loads `.xml`, while IntelliJ's manual Import Scheme dialog only accepts `.icls`.
export function intellijThemeFiles(theme, prefix = '') {
  const scheme = emitIclsScheme(theme);
  return [
    file(`${prefix}src/main/resources/themes/candela-${theme.id}.xml`, scheme),
    file(`${prefix}src/main/resources/themes/candela-${theme.id}.icls`, scheme),
    file(`${prefix}src/main/resources/themes/candela-${theme.id}.theme.json`, emitIntellijTheme(theme)),
  ];
}

export function emitIntellijThemePackage(theme) {
  return {
    files: [
      ...intellijGradleFiles(`candela-${theme.id}`, DEFAULT_VERSION),
      ...intellijThemeFiles(theme),
      file('src/main/resources/META-INF/plugin.xml', emitIntellijPluginXml([theme])),
    ],
  };
}
