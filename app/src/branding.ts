// The site reads its brand line from the same module every marketplace listing
// does, so the pitch can't drift between candela.ink and the stores. The static
// <meta> tags in app/*.html can't import JS; scripts/validate.js string-compares
// them against lib/copy.js instead. See lib/copy.js.
import { TAGLINE } from '../../lib/copy.js';

export type Brand = { name: string; tagline: string };

// The project name. Picked from an A/B/C name experiment (Aurora/Fovea/Candela);
// Candela won, so the site is single-brand now — no ?name= switching.
export const brand: Brand = {
  name: 'Candela',
  tagline: TAGLINE,
};
