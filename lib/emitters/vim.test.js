import assert from 'node:assert/strict';
import test from 'node:test';
import source from '../../themes/candela-themes.json' with { type: 'json' };
import { hexToXterm256Index } from '../colors.js';
import { emitFullFamily, FORMAT_EMITTERS, installReadme } from './index.js';
import { emitVimPackage, emitVimTheme } from './vim.js';

test('Vim colorschemes use Candela tokens, styles, and xterm fallbacks', () => {
  const { themes, ansiMapping } = source;
  const theme = themes[0];
  const output = emitVimTheme(theme, ansiMapping);

  assert.match(output, new RegExp(`set background=${theme.mode}`));
  assert.match(output, new RegExp(`let g:colors_name = 'candela-${theme.id}'`));
  for (const [group, token] of [
    ['Comment', 'faint'],
    ['Keyword', 'kw'],
    ['String', 'str'],
    ['Function', 'fn'],
    ['Type', 'type'],
  ]) {
    assert.match(output, new RegExp(`highlight ${group} guifg=${theme.colors[token]} ctermfg=\\d+`));
  }
  assert.match(output, /highlight Comment .*gui=italic cterm=italic/);
  assert.match(output, /highlight Title .*gui=bold cterm=bold/);
  assert.doesNotMatch(output, /highlight @/);
  assert.match(output, /let g:terminal_ansi_colors = \['#[0-9a-f]{6}',/);
  assert.equal(emitVimPackage(theme, ansiMapping).files[0].path, `candela-${theme.id}.vim`);
  assert.equal(FORMAT_EMITTERS.find((format) => format.tool === 'vim').label, 'Vim');
  assert.match(installReadme('vim', theme), /\.vim\/colors/);

  const files = emitFullFamily(themes, ansiMapping, '', '').files
    .filter((entry) => entry.path.startsWith('vim/'));
  assert.deepEqual(files.map((entry) => entry.path), themes.map((entry) => `vim/candela-${entry.id}.vim`));
});

test('xterm-256 fallback uses the nearest palette color', () => {
  assert.equal(hexToXterm256Index('#000000'), 0);
  assert.equal(hexToXterm256Index('#ffffff'), 15);
  assert.equal(hexToXterm256Index('#ff0000'), 9);
  assert.equal(hexToXterm256Index('#005f00'), 22);
});
