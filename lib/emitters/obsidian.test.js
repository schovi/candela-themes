import assert from 'node:assert/strict';
import test from 'node:test';
import source from '../../themes/candela-themes.json' with { type: 'json' };
import { emitFullFamily, FORMAT_EMITTERS, installReadme } from './index.js';
import { emitObsidianTheme, obsidianManifest, obsidianThemeCss } from './obsidian.js';

test('Obsidian family carries every palette and its required files', () => {
  const { themes, ansiMapping } = source;
  const files = new Map(emitFullFamily(themes, ansiMapping, '', '', '1.2.3').files.map((entry) => [entry.path, entry.content]));
  const css = files.get('obsidian/Candela/theme.css');

  assert.deepEqual([...files.keys()].filter((path) => path.startsWith('obsidian/Candela/')).sort(), [
    'obsidian/Candela/README.md',
    'obsidian/Candela/manifest.json',
    'obsidian/Candela/theme.css',
  ]);
  assert.equal(JSON.parse(files.get('obsidian/Candela/manifest.json')).version, '1.2.3');
  assert.match(css, /title: Light palette/);
  assert.match(css, /title: Dark palette/);
  assert.match(css, /--background-secondary-alt: #/);
  assert.match(css, /--modal-background: #/);
  assert.match(css, /--color-base-00: #/);
  assert.match(css, /--color-base-100: #/);
  assert.match(css, /--code-keyword: #/);
  assert.match(css, /--code-operator: #/);
  for (const theme of themes) {
    assert.match(css, new RegExp(`body\\.theme-${theme.mode}\\.candela-${theme.id} \\{`));
  }
});

test('Obsidian single-theme export is an installable Candela folder', () => {
  const theme = source.themes[0];
  const output = emitObsidianTheme(theme).files;

  assert.deepEqual(output.map((entry) => entry.path), ['Candela/manifest.json', 'Candela/theme.css']);
  assert.equal(JSON.parse(output[0].content).name, 'Candela');
  assert.doesNotMatch(output[1].content, /@settings/);
  assert.match(output[1].content, /\.theme-light \{/);
  assert.equal(obsidianManifest('1.2.3').version, '1.2.3');
  assert.match(obsidianThemeCss([theme], false), /--text-normal: #/);
  assert.equal(FORMAT_EMITTERS.find((format) => format.tool === 'obsidian').label, 'Obsidian');
  assert.match(installReadme('obsidian', theme), /Candela folder/);
});
