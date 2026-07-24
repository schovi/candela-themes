import { checkTheme, expectedTokens } from '../../lib/rules.js';
import { hexToHsl, hslToHex } from '../../lib/colors.js';
import { tokenReference, type Theme, type ColorToken } from './themes';

// Snap a failing draft toward a passing one by adjusting ONLY lightness (hue and
// chroma preserved), using the shared rule engine as the pass/fail oracle so no
// rule logic is duplicated here. Several passes let dependent tokens re-settle
// after bg/surface move. Anything unreachable by lightness alone is left as-is,
// so residual failures can remain (contrast is a function of lightness, so this
// clears the common cases: too-light accents, pure white/black, surface<=bg).
const LIGHTNESS_STEPS = 100;
const MAX_PASSES = 4;

export function autoFix(theme: Theme): Theme {
  const expected = expectedTokens(tokenReference) as ColorToken[];
  const work: Theme = { ...theme, colors: { ...theme.colors } };
  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (failureCount(work, expected) === 0) break;
    for (const token of expected) {
      work.colors[token] = fitLightness(work, token, expected);
    }
  }
  return work;
}

// Scan one token's lightness for the value that minimizes total theme failures,
// breaking ties toward the original lightness so passing tokens never wander.
// Mutates work.colors[token] in the scan and leaves it set to the best value.
// Exported so callers (e.g. the guided derivation) can fit a single foreground
// token against a frozen background without moving bg/surface.
export function fitLightness(work: Theme, token: ColorToken, expected: ColorToken[]): string {
  const original = work.colors[token];
  const { h, s, l: originalL } = hexToHsl(original);
  let best = original;
  let bestFails = Infinity;
  let bestDistance = Infinity;
  // bg must land on the side of 0.5 its declared mode requires. This is what makes
  // Auto-fix move a dark-bg/light-mode conflict toward the user's mode (darken when
  // mode says dark) instead of always lightening bg back to satisfy light. Steps
  // 49/51 keep bg off exactly 0.5, which satisfies neither mode.
  const loStep = token === 'bg' && work.mode === 'light' ? 51 : 0;
  const hiStep = token === 'bg' && work.mode === 'dark' ? 49 : LIGHTNESS_STEPS;
  for (let step = loStep; step <= hiStep; step++) {
    const l = step / LIGHTNESS_STEPS;
    const candidate = hslToHex({ h, s, l });
    work.colors[token] = candidate;
    const fails = failureCount(work, expected);
    const distance = Math.abs(l - originalL);
    if (fails < bestFails || (fails === bestFails && distance < bestDistance)) {
      best = candidate;
      bestFails = fails;
      bestDistance = distance;
    }
  }
  work.colors[token] = best;
  return best;
}

function failureCount(theme: Theme, expected: ColorToken[]): number {
  return (checkTheme(theme, expected) as { failures: string[] }).failures.length;
}
