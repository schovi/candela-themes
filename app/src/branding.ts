export type Brand = { name: string; tagline: string };

// The project name. Picked from an A/B/C name experiment (Aurora/Fovea/Candela);
// Candela won, so the site is single-brand now — no ?name= switching.
export const brand: Brand = {
  name: 'Candela',
  tagline: 'Light, measured for tired eyes.',
};
