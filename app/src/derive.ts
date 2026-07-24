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
import { hexToHsl, hslToHex } from '../../lib/colors.js';
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
  sourceDraft?: Theme;
}

// Low-chroma, mood-tinted gray the whole UI scale is stepped from. Neutral is
// nearly achromatic; warm/cool carry a faint paper/sky tint. Kept desaturated —
// the load-bearing anti-fringing rule (see docs/vision-research.md).
export const MOOD_BG: Record<Mood, { h: number; s: number }> = {
  warm: { h: 35, s: 0.16 },
  cool: { h: 220, s: 0.1 },
  neutral: { h: 40, s: 0.03 },
};

// Accents sit in the desaturated band; punct is the muted operator gray. Fixed
// here (not user-controlled) so guided output can't drift into neon.
export const ACCENT_SAT = 0.5;
export const PUNCT_SAT = 0.12;
export const ACCENT_L = 0.42;

const HEX = /^#[0-9a-fA-F]{6}$/;

// Diagnostics: saturation/lightness fixed, hue chosen. error leans vermillion,
// ok leans blue-green/teal, luminance-separated so the pair reads in grayscale.
export const DIAG: Record<'error' | 'warning' | 'ok', { s: number; l: number }> = {
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

// The darkness slider spans two bands with a deliberate gap across the light/dark
// boundary at its midpoint: no usable theme has a mid-luminance bg (too light to
// be dark, too dark to be light — it clears text contrast neither way), so the
// slider skips ~0.5-0.82 and the palette inverts as darkness crosses 50.
const LIGHT_BG_MAX = 0.94; // darkness 0   — lightest light
const LIGHT_BG_MIN = 0.82; // darkness ~50 — dimmest light
const DARK_BG_MAX = 0.28; // darkness 50  — lightest dark
const DARK_BG_MIN = 0.1; // darkness 100 — darkest dark

function bgLightnessForDarkness(darkness: number): number {
  const t = clamp(darkness, 0, 100);
  return t < 50
    ? LIGHT_BG_MAX - (LIGHT_BG_MAX - LIGHT_BG_MIN) * (t / 50)
    : DARK_BG_MAX - (DARK_BG_MAX - DARK_BG_MIN) * ((t - 50) / 50);
}

// Inverse of bgLightnessForDarkness: recover the slider position from a bg's
// lightness. A light bg lands in [0,50), a dark bg in [50,100], so Simple entry
// from a dark theme keeps deriving dark. Muddy imports (bg 0.28-0.82) snap to
// their band's near-boundary end.
function darknessForBgLightness(bgLightness: number): number {
  return bgLightness >= 0.5
    ? clamp(((LIGHT_BG_MAX - bgLightness) / (LIGHT_BG_MAX - LIGHT_BG_MIN)) * 50, 0, 49)
    : clamp(50 + ((DARK_BG_MAX - bgLightness) / (DARK_BG_MAX - DARK_BG_MIN)) * 50, 50, 100);
}

// The explicit light/dark signal a bg carries: below 0.5 lightness is dark. Both
// backgroundShades bands and deriveTheme read it so mode always matches the bg.
export function modeForBg(bgHex: string): 'light' | 'dark' {
  return hexToHsl(bgHex).l < 0.5 ? 'dark' : 'light';
}

function hueDistance(first: number, second: number): number {
  const distance = Math.abs(first - second) % 360;
  return Math.min(distance, 360 - distance) / 180;
}

const roundHue = (hue: number) => Math.round(hue) % 360;

// Reconstruct guided choices from a draft's actual colors, so the sliders/wheel
// read true positions on Simple entry. Robust to invalid hex in draft.colors: a
// non-#rrggbb token falls back to its default hue rather than crashing the editor
// (raw hexToHsl throws on garbage input).
export function deriveChoices(draft: Theme): GuidedChoices {
  const background = HEX.test(draft.colors.bg) ? hexToHsl(draft.colors.bg) : { h: 40, s: 0.03, l: 0.9 };
  const hueOf = <T extends string>(token: T, fallback: number) =>
    HEX.test(draft.colors[token as ColorToken]) ? roundHue(hexToHsl(draft.colors[token as ColorToken]).h) : fallback;
  const mood = (Object.entries(MOOD_BG) as [Mood, { h: number; s: number }][]).reduce(
    (nearest, candidate) => {
      const nearestDistance = Math.hypot(hueDistance(background.h, nearest[1].h), background.s - nearest[1].s);
      const candidateDistance = Math.hypot(hueDistance(background.h, candidate[1].h), background.s - candidate[1].s);
      return candidateDistance < nearestDistance ? candidate : nearest;
    },
  )[0];

  return {
    name: draft.name,
    tone: draft.tone,
    description: draft.description,
    fonts: { ...draft.fonts },
    mood,
    darkness: darknessForBgLightness(background.l),
    accentHues: Object.fromEntries(
      SYNTAX_TOKENS.map((token) => [token, hueOf(token, DEFAULT_CHOICES.accentHues[token])]),
    ) as Record<SyntaxToken, number>,
    diagnosticHues: {
      error: hueOf('error', DEFAULT_CHOICES.diagnosticHues.error),
      warning: hueOf('warning', DEFAULT_CHOICES.diagnosticHues.warning),
      ok: hueOf('ok', DEFAULT_CHOICES.diagnosticHues.ok),
    },
    sourceDraft: { ...draft, fonts: { ...draft.fonts }, colors: { ...draft.colors } },
  };
}

function hasUnchangedDerivedColors(choices: GuidedChoices): boolean {
  if (!choices.sourceDraft) return false;
  const sourceChoices = deriveChoices(choices.sourceDraft);
  return choices.mood === sourceChoices.mood &&
    choices.darkness === sourceChoices.darkness &&
    SYNTAX_TOKENS.every((token) => choices.accentHues[token] === sourceChoices.accentHues[token]) &&
    (['error', 'warning', 'ok'] as const).every(
      (token) => choices.diagnosticHues[token] === sourceChoices.diagnosticHues[token],
    );
}

export function slugify(name: string, fallback = 'my-theme'): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || fallback;
}

// The UI tokens the background formula owns: a mood/darkness edit recomputes
// exactly these. ink/ink2/faint/cursor have no other Simple control, so the
// formula is their sole source.
type BackgroundToken =
  | 'bg' | 'surface' | 'border' | 'ink' | 'ink2' | 'faint' | 'selection' | 'cursor' | 'lineHighlight';
const BACKGROUND_TOKENS: BackgroundToken[] = [
  'bg', 'surface', 'border', 'ink', 'ink2', 'faint', 'selection', 'cursor', 'lineHighlight',
];

// Background + neutral text stepped deterministically from the mood-tinted gray.
// Shared by deriveTheme (wholesale) and applyBackground (targeted Simple edit).
function backgroundShades(mood: Mood, darkness: number): Record<BackgroundToken, string> {
  const base = MOOD_BG[mood];
  const bgL = bgLightnessForDarkness(darkness);
  // Mood-tinted shade at lightness l; sMul lets ink/selection carry a touch more tint.
  const shade = (l: number, sMul = 1) => hslToHex({ h: base.h, s: clamp(base.s * sMul, 0, 1), l: clamp(l, 0, 1) });
  // Dark inverts the light scale's relationships (per the shipped dark themes):
  // surface stays the lighter of the two, but border/selection/lineHighlight sit
  // ABOVE bg and ink becomes light. Seeds are refined by the foreground fitter, so
  // they only need the right side of the contrast floors.
  if (bgL < 0.5) {
    return {
      bg: shade(bgL),
      surface: shade(bgL + 0.03),
      border: shade(bgL + 0.12),
      ink: shade(0.8, 1.1),
      ink2: shade(0.55),
      faint: shade(0.58),
      selection: shade(bgL + 0.14, 1.6),
      cursor: shade(0.8, 1.1),
      lineHighlight: shade(bgL + 0.06, 1.2),
    };
  }
  return {
    bg: shade(bgL),
    surface: shade(bgL + 0.03),
    border: shade(bgL - 0.14),
    ink: shade(0.2, 1.1),
    ink2: shade(0.38),
    faint: shade(0.5),
    selection: shade(bgL - 0.08, 1.6),
    cursor: shade(0.2, 1.1),
    lineHighlight: shade(bgL - 0.03, 1.2),
  };
}

// Targeted guided edits (task 048): each recomputes ONLY the token(s) its control
// owns, using the same per-token oracles deriveTheme uses, and leaves every other
// token at its current hex. This is what keeps hand-tuned Pro tokens intact when a
// Simple control is nudged. Each fits the edited token's lightness against the
// current draft so it still clears its floor.

// Mood / background-darkness: recompute the background-owned UI tokens, fit those
// foregrounds against the new bg. Accents and diagnostics keep their hexes.
export function applyBackground(draft: Theme, mood: Mood, darkness: number): Theme {
  const expected = expectedTokens(tokenReference) as ColorToken[];
  const shades = backgroundShades(mood, darkness);
  const mode = modeForBg(shades.bg);
  const work: Theme = { ...draft, mode, colors: { ...draft.colors, ...shades } };
  // A light<->dark flip inverts the whole palette — a light-fitted accent can't
  // render on a dark bg — so refit every foreground. A same-mode darkness nudge
  // keeps task 048's promise: only the background-owned UI tokens move.
  const flipped = mode !== draft.mode;
  const fitSet = (flipped ? expected : BACKGROUND_TOKENS).filter((token) => token !== 'bg' && token !== 'surface');
  for (let pass = 0; pass < 2; pass++) {
    for (const token of fitSet) work.colors[token] = fitLightness(work, token, expected);
  }
  return work;
}

export function applyAccentHue(draft: Theme, token: SyntaxToken, hue: number): Theme {
  const expected = expectedTokens(tokenReference) as ColorToken[];
  const s = token === 'punct' ? PUNCT_SAT : ACCENT_SAT;
  const work: Theme = { ...draft, colors: { ...draft.colors, [token]: hslToHex({ h: hue, s, l: ACCENT_L }) } };
  work.colors[token] = fitLightness(work, token, expected);
  return work;
}

export function applyDiagnosticHue(draft: Theme, token: 'error' | 'warning' | 'ok', hue: number): Theme {
  const expected = expectedTokens(tokenReference) as ColorToken[];
  const work: Theme = { ...draft, colors: { ...draft.colors, [token]: hslToHex({ h: hue, s: DIAG[token].s, l: DIAG[token].l }) } };
  work.colors[token] = fitLightness(work, token, expected);
  return work;
}

export function deriveTheme(choices: GuidedChoices): Theme {
  if (hasUnchangedDerivedColors(choices)) {
    return {
      ...choices.sourceDraft!,
      name: choices.name,
      tone: choices.tone,
      description: choices.description,
      fonts: { ...choices.fonts },
      colors: { ...choices.sourceDraft!.colors },
    };
  }
  const accent = (hue: number, s: number) => hslToHex({ h: hue, s, l: ACCENT_L });

  const colors: Record<ColorToken, string> = {
    ...backgroundShades(choices.mood, choices.darkness),
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
    mode: modeForBg(colors.bg),
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
