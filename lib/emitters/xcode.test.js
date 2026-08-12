import assert from 'node:assert/strict';
import test from 'node:test';
import source from '../../themes/candela-themes.json' with { type: 'json' };
import { hexToFloat } from '../colors.js';
import { emitFullFamily, FORMAT_EMITTERS, installReadme } from './index.js';
import { emitXcodePackage, emitXcodeTheme } from './xcode.js';

test('Xcode themes map Candela editor, console, markup, and syntax colors', () => {
  const { themes, ansiMapping } = source;
  const theme = themes[0];
  const output = emitXcodeTheme(theme);
  const color = (token) => {
    const { r, g, b } = hexToFloat(theme.colors[token]);
    return `${r.toFixed(3)} ${g.toFixed(3)} ${b.toFixed(3)} 1`;
  };

  assert.match(output, /<plist version="1.0">/);
  assert.match(output, new RegExp(`<key>DVTSourceTextBackground</key>\\n\\t<string>${color('bg')}</string>`));
  for (const [key, token] of [
    ['xcode.syntax.comment', 'faint'],
    ['xcode.syntax.keyword', 'kw'],
    ['xcode.syntax.string', 'str'],
    ['xcode.syntax.number', 'num'],
    ['xcode.syntax.identifier.function', 'fn'],
    ['xcode.syntax.identifier.type', 'type'],
    ['xcode.syntax.identifier.variable.system', 'builtin'],
    ['xcode.syntax.attribute', 'punct'],
  ]) {
    assert.match(output, new RegExp(`<key>${key}</key>\\n\\t<string>${color(token)}</string>`));
  }
  assert.doesNotMatch(output, /DVTSourceTextSyntaxFonts/);
  assert.equal(emitXcodePackage(theme).files[0].path, `Candela ${theme.name}.xccolortheme`);
  assert.equal(FORMAT_EMITTERS.find((format) => format.tool === 'xcode').label, 'Xcode');
  assert.match(installReadme('xcode', theme), /FontAndColorThemes/);

  const files = emitFullFamily(themes, ansiMapping, '', '').files
    .filter((entry) => entry.path.startsWith('xcode/'));
  assert.deepEqual(files.map((entry) => entry.path), themes.map((entry) => `xcode/Candela ${entry.name}.xccolortheme`));
});
