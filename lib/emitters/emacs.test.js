import assert from 'node:assert/strict';
import test from 'node:test';
import source from '../../themes/candela-themes.json' with { type: 'json' };
import { emitFullFamily, FORMAT_EMITTERS, installReadme } from './index.js';
import { emitEmacsPackage, emitEmacsTheme } from './emacs.js';

test('Emacs themes map Candela faces, ANSI colors, and background mode', () => {
  const { themes, ansiMapping } = source;
  const theme = themes[0];
  const output = emitEmacsTheme(theme, ansiMapping);

  assert.match(output, new RegExp(`\\(deftheme candela-${theme.id} `));
  assert.match(output, new RegExp(`\\(provide-theme 'candela-${theme.id}\\)`));
  for (const [face, token] of [
    ['font-lock-comment-face', 'faint'],
    ['font-lock-keyword-face', 'kw'],
    ['font-lock-string-face', 'str'],
    ['font-lock-function-name-face', 'fn'],
    ['font-lock-number-face', 'num'],
    ['font-lock-type-face', 'type'],
    ['font-lock-builtin-face', 'builtin'],
    ['font-lock-punctuation-face', 'punct'],
  ]) {
    assert.match(output, new RegExp(`\\(${face} \\(\\(t \\(:foreground "${theme.colors[token]}"\\)\\)\\)\\)`));
  }
  assert.match(output, new RegExp(`\\(frame-background-mode '${theme.mode}\\)`));
  assert.match(output, /\(ansi-color-names-vector \[/);
  assert.equal(emitEmacsPackage(theme, ansiMapping).files[0].path, `candela-${theme.id}-theme.el`);
  assert.equal(FORMAT_EMITTERS.find((format) => format.tool === 'emacs').label, 'Emacs');
  assert.match(installReadme('emacs', theme), /custom-theme-load-path/);

  const files = emitFullFamily(themes, ansiMapping, '', '').files
    .filter((entry) => entry.path.startsWith('emacs/'));
  assert.deepEqual(files.map((entry) => entry.path), themes.map((entry) => `emacs/candela-${entry.id}-theme.el`));
});
