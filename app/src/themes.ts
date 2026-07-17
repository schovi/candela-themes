// The single import of the source-of-truth JSON. Task 011 (deleting the old
// .dc.html showcases) only needs to change this one line if the JSON moves.
import data from '../../docs/design-handover/aurora-themes.json';

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
