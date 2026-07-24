// Parses the human-readable messages lib/rules.js emits into a UI action: an
// explanation string and the rail control to jump to. These regexes mirror the
// exact message shapes rules.js produces (plus our own hex-format error) — if a
// message there is reworded, ruleMessages.test.ts fails loudly rather than the
// jump/explanation silently going missing.
import { SYNTAX_ACCENTS, DIAGNOSTICS } from '../../lib/rules.js';
import type { ColorToken } from './themes';

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
  if (message.startsWith('mode ')) return 'Move Background darkness to the other side of the midpoint (Simple), or adjust bg lightness (UI).';
  if (message.startsWith('tags must ')) return 'Use Start over and choose a built-in theme or a valid saved draft (Starting point).';
  if (message.startsWith('bg is pure ')) return 'Move the bg color away from pure white (UI).';
  if (message.startsWith('surface is pure ')) return 'Move the surface color away from pure white (UI).';
  if (message.startsWith('surface ') && message.includes('not lighter than bg')) return 'Make surface slightly lighter than bg (UI).';
  if (message.startsWith('ink is pure ')) return 'Move the ink color away from pure black (UI).';
  const contrastFailure = message.match(/^(\w+) on (bg|surface|selection) /);
  if (contrastFailure) return `Lighten or darken ${contrastFailure[1]} until it passes (${controlGroupForToken(contrastFailure[1])}).`;
  const collision = message.match(/^diagnostic collision: (\w+) and (\w+) share/);
  if (collision) {
    const groups = [...new Set([controlGroupForToken(collision[1]), controlGroupForToken(collision[2])])].join(' and ');
    return `Choose different colors for ${collision[1]} and ${collision[2]} (${groups}).`;
  }
  if (message.includes('distinct accent hues')) return 'Spread the accent colors across 6–8 distinct hues (Syntax).';
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
    /^(\w+) on (?:bg|surface|selection) /,
    /^(\w+) is pure #/,
    /^(surface) #[0-9a-f]{6} not lighter than /,
    /^diagnostic collision: (\w+) and /,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1] as ColorToken;
  }
  if (message.includes('requires bg lightness')) return 'bg';
  if (message.startsWith('error/ok ')) return 'error';
  return null;
}
