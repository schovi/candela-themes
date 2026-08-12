import assert from 'node:assert/strict';
import test from 'node:test';
import source from '../../themes/candela-themes.json' with { type: 'json' };
import { emitFullFamily, FORMAT_EMITTERS, installReadme } from './index.js';

test('Slack themes use the verified import order and mode-specific sidebar setting', () => {
  const { themes, ansiMapping } = source;
  const slack = FORMAT_EMITTERS.find((format) => format.tool === 'slack');

  assert.equal(slack.label, 'Slack');
  assert.match(installReadme('slack', themes[0]), /Custom theme → Import/);

  for (const theme of [themes.find((candidate) => candidate.mode === 'light'), themes.find((candidate) => candidate.mode === 'dark')]) {
    const output = slack.emit(theme, ansiMapping).files[0];
    const navigation = theme.mode === 'light' ? theme.colors.ink2 : theme.colors.surface;

    assert.equal(output.path, `candela-${theme.id}.txt`);
    assert.match(output.content, new RegExp(`Candela ${theme.name}`));
    assert.match(output.content, new RegExp(`${navigation},${theme.colors.selection},${theme.colors.ok},${theme.colors.error}`));
    assert.match(output.content, new RegExp(`Darker sidebars: ${theme.mode === 'light' ? 'on' : 'off'}`));
    assert.match(output.content, /Window gradient: off/);
  }

  const files = emitFullFamily(themes, ansiMapping, '', '').files
    .filter((entry) => entry.path.startsWith('slack/'));
  assert.deepEqual(files.map((entry) => entry.path), themes.map((theme) => `slack/candela-${theme.id}.txt`));
});
