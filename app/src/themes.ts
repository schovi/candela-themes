// The single import of the source-of-truth JSON. If the JSON moves, only this
// one line changes.
import data from '../../themes/aurora-themes.json';
import type { CSSProperties } from 'react';

export type ColorToken =
  | 'bg' | 'surface' | 'border' | 'ink' | 'ink2' | 'faint'
  | 'selection' | 'cursor' | 'lineHighlight'
  | 'kw' | 'str' | 'fn' | 'num' | 'type' | 'builtin' | 'punct'
  | 'error' | 'warning' | 'ok';

export interface Theme {
  id: string;
  name: string;
  tone: string;
  description: string;
  fonts: { code: string; prose: string };
  colors: Record<ColorToken, string>;
}

export const themes: Theme[] = (data as { themes: Theme[] }).themes;
export const themesById = new Map(themes.map((t) => [t.id, t]));

// Dark themes carry "dark" in their tone string (there is no source `mode`
// field yet — that's task 022). Derive the split so counts never hardcode.
export const isDarkTheme = (theme: Theme) => theme.tone.includes('dark');
export const darkThemes = themes.filter(isDarkTheme);
export const lightThemes = themes.filter((t) => !isDarkTheme(t));

// Map every theme token to a CSS variable, plus the code/prose fonts, so any
// preview renders straight from the source-of-truth values.
export function themeVars(theme: Theme): CSSProperties {
  const vars: Record<string, string> = {
    '--code-font': `'${theme.fonts.code}'`,
    '--prose-font': `'${theme.fonts.prose}'`,
  };
  for (const [token, hex] of Object.entries(theme.colors)) {
    vars[`--${token}`] = hex;
  }
  return vars as CSSProperties;
}

// The token catalog (roles by group), from the same source of truth. The
// playground iterates it and feeds it to the shared rule module's
// expectedTokens() so "which tokens must exist" is never hard-coded twice.
export interface TokenReference {
  ui: Record<string, string>;
  syntax: Record<string, string>;
  diagnostics: Record<string, string>;
}
export const tokenReference = (data as { tokenReference: TokenReference }).tokenReference;
