import { file } from './shared.js';

export function emitSlackTheme(theme) {
  const navigation = theme.mode === 'light' ? theme.colors.ink2 : theme.colors.surface;
  return [
    `Candela ${theme.name} for Slack`,
    '',
    'Paste this into Preferences → Appearance → Custom theme → Import:',
    [navigation, theme.colors.selection, theme.colors.ok, theme.colors.error].join(','),
    '',
    `Darker sidebars: ${theme.mode === 'light' ? 'on' : 'off'}`,
    'Window gradient: off',
    '',
  ].join('\n');
}

export const slackThemeFile = (theme, prefix = '') =>
  file(`${prefix}candela-${theme.id}.txt`, emitSlackTheme(theme));
