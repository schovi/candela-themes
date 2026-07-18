// Guided-view derivation: turn a handful of high-level choices (background mood
// + darkness, one accent hue per syntax token, three diagnostic hues) into a
// complete, rule-valid theme. Background + neutral text are stepped
// deterministically from a mood-tinted gray; every foreground token then has its
// lightness fitted (shared search against the real rule engine) against that
// frozen background, so accents clear their AA floor on bg and diagnostics clear
// their collisions without ever moving bg/surface (which would fight the chosen
// darkness). Result is always rule-valid and exportable.
import { fitLightness } from './autofix';
import { SYNTAX_ACCENTS, expectedTokens } from '../../lib/rules.js';
import { hslToHex } from '../../lib/colors.js';
import { tokenReference, type Theme, type ColorToken } from './themes';

export type Mood = 'warm' | 'cool' | 'neutral';
export type SyntaxToken = 'kw' | 'str' | 'fn' | 'num' | 'type' | 'builtin' | 'punct';

export interface GuidedChoices {
  name: string;
  tone: string;
  description: string;
  fonts: { code: string; prose: string };
  mood: Mood;
  darkness: number; // 0..100, higher = dimmer background
  accentHues: Record<SyntaxToken, number>; // 0..360 per syntax token
  diagnosticHues: { error: number; warning: number; ok: number };
}

// Low-chroma, mood-tinted gray the whole UI scale is stepped from. Neutral is
// nearly achromatic; warm/cool carry a faint paper/sky tint. Kept desaturated —
// the load-bearing anti-fringing rule (see docs/vision-research.md).
const MOOD_BG: Record<Mood, { h: number; s: number }> = {
  warm: { h: 35, s: 0.16 },
  cool: { h: 220, s: 0.1 },
  neutral: { h: 40, s: 0.03 },
};

// Accents sit in the desaturated band; punct is the muted operator gray. Fixed
// here (not user-controlled) so guided output can't drift into neon.
const ACCENT_SAT = 0.5;
const PUNCT_SAT = 0.12;
const ACCENT_L = 0.42;

// Diagnostics: saturation/lightness fixed, hue chosen. error leans vermillion,
// ok leans blue-green/teal, luminance-separated so the pair reads in grayscale.
const DIAG: Record<'error' | 'warning' | 'ok', { s: number; l: number }> = {
  error: { s: 0.62, l: 0.47 },
  warning: { s: 0.72, l: 0.42 },
  ok: { s: 0.52, l: 0.33 }, // darker than error, to read apart in grayscale
};

export const DEFAULT_CHOICES: GuidedChoices = {
  name: 'My Theme',
  tone: 'custom',
  description: 'A new Candela-style light theme.',
  fonts: { code: 'JetBrains Mono', prose: 'IBM Plex Sans' },
  mood: 'warm',
  darkness: 40,
  // Blue + orange carry the most meaning; the rest spread to hit 6-8 distinct hues.
  accentHues: { kw: 28, str: 130, fn: 210, num: 15, type: 275, builtin: 185, punct: 40 },
  diagnosticHues: { error: 8, warning: 38, ok: 162 },
};

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-theme';
}

export function deriveTheme(choices: GuidedChoices): Theme {
  const base = MOOD_BG[choices.mood];
  const t = clamp(choices.darkness, 0, 100) / 100;
  // Ceiling kept off pure white so surface (bgL + 0.03) has headroom and never
  // rounds to the same/lighter luminance as bg near white.
  const bgL = 0.94 - 0.06 * t;
  // Mood-tinted shade at lightness l; sMul lets ink/selection carry a touch more tint.
  const shade = (l: number, sMul = 1) => hslToHex({ h: base.h, s: clamp(base.s * sMul, 0, 1), l: clamp(l, 0, 1) });
  const accent = (hue: number, s: number) => hslToHex({ h: hue, s, l: ACCENT_L });

  const colors: Record<ColorToken, string> = {
    bg: shade(bgL),
    surface: shade(bgL + 0.03),
    border: shade(bgL - 0.14),
    ink: shade(0.2, 1.1),
    ink2: shade(0.38),
    faint: shade(0.5),
    selection: shade(bgL - 0.08, 1.6),
    cursor: shade(0.2, 1.1),
    lineHighlight: shade(bgL - 0.03, 1.2),
    kw: accent(choices.accentHues.kw, ACCENT_SAT),
    str: accent(choices.accentHues.str, ACCENT_SAT),
    fn: accent(choices.accentHues.fn, ACCENT_SAT),
    num: accent(choices.accentHues.num, ACCENT_SAT),
    type: accent(choices.accentHues.type, ACCENT_SAT),
    builtin: accent(choices.accentHues.builtin, ACCENT_SAT),
    punct: accent(choices.accentHues.punct, PUNCT_SAT),
    error: hslToHex({ h: choices.diagnosticHues.error, s: DIAG.error.s, l: DIAG.error.l }),
    warning: hslToHex({ h: choices.diagnosticHues.warning, s: DIAG.warning.s, l: DIAG.warning.l }),
    ok: hslToHex({ h: choices.diagnosticHues.ok, s: DIAG.ok.s, l: DIAG.ok.l }),
  };

  const theme: Theme = {
    id: slugify(choices.name),
    name: choices.name,
    tone: choices.tone,
    tags: [choices.tone],
    mode: 'light',
    description: choices.description,
    fonts: choices.fonts,
    colors,
  };
  return fitForeground(theme);
}

// Fit every foreground token's lightness (hue/chroma fixed) so it clears its
// floor against the frozen bg/surface. Two passes let diagnostics re-settle
// after the accents (num/kw) they collide against move. bg/surface stay put.
function fitForeground(theme: Theme): Theme {
  const expected = expectedTokens(tokenReference) as ColorToken[];
  const fitSet = expected.filter((tk) => tk !== 'bg' && tk !== 'surface');
  const work: Theme = { ...theme, colors: { ...theme.colors } };
  for (let pass = 0; pass < 2; pass++) {
    for (const token of fitSet) {
      work.colors[token] = fitLightness(work, token, expected);
    }
  }
  return work;
}

export const SYNTAX_TOKENS = SYNTAX_ACCENTS as SyntaxToken[];
