// The single import of the source-of-truth JSON. If the JSON moves, only this
// one line changes.
import data from '../../themes/aurora-themes.json';

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

// The token catalog (roles by group), from the same source of truth. The
// playground iterates it and feeds it to the shared rule module's
// expectedTokens() so "which tokens must exist" is never hard-coded twice.
export interface TokenReference {
  ui: Record<string, string>;
  syntax: Record<string, string>;
  diagnostics: Record<string, string>;
}
export const tokenReference = (data as { tokenReference: TokenReference }).tokenReference;
