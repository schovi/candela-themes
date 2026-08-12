import { hexToFloat } from '../colors.js';
import { file } from './shared.js';

const SYNTAX_COLORS = [
  ['xcode.syntax.plain', 'ink'],
  ['xcode.syntax.comment', 'faint'],
  ['xcode.syntax.comment.doc', 'faint'],
  ['xcode.syntax.comment.doc.keyword', 'faint'],
  ['xcode.syntax.keyword', 'kw'],
  ['xcode.syntax.string', 'str'],
  ['xcode.syntax.character', 'str'],
  ['xcode.syntax.number', 'num'],
  ['xcode.syntax.identifier.function', 'fn'],
  ['xcode.syntax.identifier.function.system', 'fn'],
  ['xcode.syntax.identifier.type', 'type'],
  ['xcode.syntax.identifier.class', 'type'],
  ['xcode.syntax.identifier.class.system', 'type'],
  ['xcode.syntax.identifier.variable', 'builtin'],
  ['xcode.syntax.identifier.variable.system', 'builtin'],
  ['xcode.syntax.identifier.constant', 'builtin'],
  ['xcode.syntax.identifier.constant.system', 'builtin'],
  ['xcode.syntax.identifier.macro', 'builtin'],
  ['xcode.syntax.preprocessor', 'builtin'],
  ['xcode.syntax.attribute', 'punct'],
  ['xcode.syntax.url', 'fn'],
  ['xcode.syntax.mark', 'ink2'],
];

function xcodeColor(hex) {
  const { r, g, b } = hexToFloat(hex);
  return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} 1`;
}

export function emitXcodeTheme(theme) {
  const entry = (key, token) => `\t<key>${key}</key>\n\t<string>${xcodeColor(theme.colors[token])}</string>`;
  const syntax = SYNTAX_COLORS.map(([key, token]) => entry(key, token)).join('\n');
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
    '<plist version="1.0">',
    '<dict>',
    entry('DVTSourceTextBackground', 'bg'),
    entry('DVTSourceTextInsertionPointColor', 'cursor'),
    entry('DVTSourceTextSelectionColor', 'selection'),
    entry('DVTSourceTextCurrentLineHighlightColor', 'lineHighlight'),
    entry('DVTSourceTextInvisiblesColor', 'faint'),
    entry('DVTSourceTextBlockDimBackgroundColor', 'surface'),
    entry('DVTConsoleTextColor', 'ink'),
    entry('DVTConsoleDebuggerInputTextColor', 'ink'),
    entry('DVTConsoleErrorTextColor', 'error'),
    entry('DVTMarkupTextNormalColor', 'ink'),
    entry('DVTMarkupTextLinkColor', 'fn'),
    '\t<key>DVTSourceTextSyntaxColors</key>',
    '\t<dict>',
    syntax,
    '\t</dict>',
    '</dict>',
    '</plist>',
    '',
  ].join('\n');
}

export const xcodeThemeFile = (theme, prefix = '') =>
  file(`${prefix}Candela ${theme.name}.xccolortheme`, emitXcodeTheme(theme));

export const emitXcodePackage = (theme) => ({ files: [xcodeThemeFile(theme)] });
