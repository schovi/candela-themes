import { hexToHsl, hslToHex } from '../../lib/colors.js';
import { autoFix } from './autofix';
import type { ColorToken, Theme } from './themes';

export type PaletteHelper = 'contrast' | 'saturation' | 'warmth' | 'darkness';
export type PaletteHelperValues = Record<PaletteHelper, number>;

const PALETTE_HELPER_ORDER: PaletteHelper[] = ['contrast', 'saturation', 'warmth', 'darkness'];

const clamp = (value: number, minimum: number, maximum: number) => Math.max(minimum, Math.min(maximum, value));

export function applyPaletteHelper(theme: Theme, helper: PaletteHelper, amount: number): Theme {
  const colors = { ...theme.colors };
  const backgroundLightness = hexToHsl(colors.bg).l;
  for (const token of Object.keys(colors) as ColorToken[]) {
    const hsl = hexToHsl(colors[token]);
    if (helper === 'contrast' && token !== 'bg' && token !== 'surface') {
      hsl.l = clamp(backgroundLightness + (hsl.l - backgroundLightness) * (1 + amount * 0.6), 0.02, 0.98);
    } else if (helper === 'saturation') {
      hsl.s = clamp(hsl.s * (1 + amount), 0, 0.62);
    } else if (helper === 'warmth') {
      hsl.h = (hsl.h + amount * 24 + 360) % 360;
    } else if (helper === 'darkness') {
      hsl.l = clamp(hsl.l - amount * 0.12, 0.02, 0.98);
    }
    colors[token] = hslToHex(hsl);
  }
  return autoFix({ ...theme, colors });
}

export function applyPaletteHelperValues(theme: Theme, values: PaletteHelperValues): Theme {
  return PALETTE_HELPER_ORDER.reduce(
    (result, helper) => values[helper] === 0 ? result : applyPaletteHelper(result, helper, values[helper] / 50),
    theme,
  );
}
