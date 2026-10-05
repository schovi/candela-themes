// Parses the human-readable messages lib/rules.js emits into a UI action: an
// explanation string and the rail control to jump to. These regexes mirror the
// exact message shapes rules.js produces (plus our own hex-format error) — if a
// message there is reworded, ruleMessages.test.ts fails loudly rather than the
// jump/explanation silently going missing.
import { SYNTAX_ACCENTS, DIAGNOSTICS } from '../../lib/rules.js';
import type { ColorToken } from './themes';

const COLOR_TOKENS = new Set<ColorToken>([
  'bg', 'surface', 'border', 'ink', 'ink2', 'faint', 'selection', 'cursor', 'lineHighlight',
  'kw', 'str', 'fn', 'num', 'type', 'builtin', 'punct', 'error', 'warning', 'ok',
]);

function asColorToken(token: string): ColorToken | null {
  return COLOR_TOKENS.has(token as ColorToken) ? token as ColorToken : null;
}

export function controlGroupForToken(token: string): string {
  if ((SYNTAX_ACCENTS as string[]).includes(token)) return 'Syntax';
  if ((DIAGNOSTICS as string[]).includes(token)) return 'Diagnostics';
  return 'UI';
}

export function explainRuleMessage(message: string): string | null {
  const invalidHex = message.match(/^(\w+) is not a #rrggbb hex color$/);
  if (invalidHex) return `Enter a six-digit hex color for ${invalidHex[1]} (${controlGroupForToken(invalidHex[1])}).`;
  const missingToken = message.match(/^missing token '(\w+)'$/);
  if (missingToken) return `Restore the ${missingToken[1]} color (${controlGroupForToken(missingToken[1])}).`;
  if (message.includes('is not one of light/dark')) return 'Use Start over and choose a built-in theme or a valid saved draft (Starting point).';
  if (message.includes('requires bg lightness')) return 'Adjust bg until its perceptual lightness matches the selected mode (UI).';
  // Drafts are always created with category 'solo', so this only fires on a corrupted save.
  if (message.startsWith('category ')) return 'Use Start over and choose a built-in theme or a valid saved draft (Starting point).';
  if (message.startsWith('tags must ')) return 'Use Start over and choose a built-in theme or a valid saved draft (Starting point).';
  if (message.startsWith('bg is pure ')) return 'Move the bg color away from pure white (UI).';
  if (message.startsWith('surface is pure ')) return 'Move the surface color away from pure white (UI).';
  if (message.startsWith('surface ') && message.includes('not lighter than bg')) return 'Make surface slightly lighter than bg (UI).';
  if (message.startsWith('ink is pure ')) return 'Move the ink color away from pure black (UI).';
  const contrastFailure = message.match(/^(\w+) on (bg|surface|lineHighlight|selection|\w+ wash) /);
  if (contrastFailure) return `Lighten or darken ${contrastFailure[1]} until it passes (${controlGroupForToken(contrastFailure[1])}).`;
  const collision = message.match(/^diagnostic collision: (\w+) and (\w+) share/);
  if (collision) {
    const groups = [...new Set([controlGroupForToken(collision[1]), controlGroupForToken(collision[2])])].join(' and ');
    return `Choose different colors for ${collision[1]} and ${collision[2]} (${groups}).`;
  }
  if (message.includes('distinct accent hues')) return 'Spread the accent colors across 6–8 distinct hues (Syntax).';
  const purpleBlue = message.match(/^(\w+) \(purple\) and (\w+) \(blue\) sit /);
  if (purpleBlue) return `Separate ${purpleBlue[1]} and ${purpleBlue[2]} by lightness (Syntax).`;
  const ansiHue = message.match(/^ansi \w+ -> (\w+) is hue /);
  if (ansiHue) return `Choose a matching ANSI hue for ${ansiHue[1]} (${controlGroupForToken(ansiHue[1])}).`;
  const ansiUnknown = message.match(/^ansi \w+ -> '(\w+)' is not a known token$/);
  if (ansiUnknown) return `Map this ANSI slot to an existing color token (${controlGroupForToken(ansiUnknown[1])}).`;
  if (message.startsWith('ansi override ')) return 'Use only red, green, yellow, blue, magenta, or cyan ANSI overrides.';
  if (message.startsWith('ansi black is not darker than ') || message.startsWith('ansi brightBlack is not darker than ')) return 'Make the ANSI dark neutral darker than its matching light neutral (UI).';
  if (message.startsWith('ansi brightBlack on bg ')) return 'Increase the brightBlack contrast against bg (UI).';
  const apca = message.match(/^(\w+) APCA Lc /);
  if (apca) return `Increase readable contrast for ${apca[1]} (${controlGroupForToken(apca[1])}).`;
  const chroma = message.match(/^(\w+) chroma .* \(too saturated\)$/);
  if (chroma) return `Reduce saturation for ${chroma[1]} (${controlGroupForToken(chroma[1])}).`;
  const lookAlike = message.match(/^(\w+)\/(\w+) look alike/);
  if (lookAlike) return `Separate ${lookAlike[1]} and ${lookAlike[2]} by hue or lightness (Syntax).`;
  const punct = message.match(/^punct matches (ink|faint) /);
  if (punct) return `Separate punctuation from ${punct[1]} (Syntax).`;
  if (message.startsWith('ink2 ') && message.includes('is not stronger than faint')) return 'Increase secondary-text contrast above comments (UI).';
  if (message.startsWith('selection barely differs from ')) return 'Make selection clearer against nearby UI grounds (UI).';
  if (message.startsWith('error/ok grayscale separation')) return 'Your error red and success green look too similar in grayscale. Lighten or darken one of them (Diagnostics).';
  if (message.startsWith('error/ok protan/deutan distance')) return 'Your error red and success green may look too similar with red-green color blindness. Change one hue (Diagnostics).';
  return null;
}

// The rail control a rule/warning names, so its inspector row can jump there.
// Matches the message shapes lib/rules.js emits (plus our own hex-format error);
// null for messages that name no single token (invalid mode/tags, hue count).
export function jumpTokenForMessage(message: string): ColorToken | null {
  const patterns = [
    /^missing token '(\w+)'$/,
    /^(\w+) is not a #rrggbb hex color$/,
    /^(\w+) on (?:bg|surface|lineHighlight|selection|\w+ wash) /,
    /^(\w+) is pure #/,
    /^(surface) #[0-9a-f]{6} not lighter than /,
    /^diagnostic collision: (\w+) and /,
    /^(\w+) \(purple\) and \w+ \(blue\) sit /,
    /^ansi \w+ -> (\w+) is hue /,
    /^(\w+) APCA Lc /,
    /^(\w+) chroma .* \(too saturated\)$/,
    /^(\w+)\/\w+ look alike/,
    /^(punct) matches (?:ink|faint) /,
    /^(ink2) .* is not stronger than faint /,
    /^(selection) barely differs from /,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return asColorToken(match[1]);
  }
  if (message.includes('requires bg lightness')) return 'bg';
  const ansiUnknown = message.match(/^ansi \w+ -> '(\w+)' is not a known token$/);
  if (ansiUnknown) return asColorToken(ansiUnknown[1]);
  if (message.startsWith('error/ok ')) return 'error';
  return null;
}
