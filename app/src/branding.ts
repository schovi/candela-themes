export type Brand = { key: string; name: string; tagline: string; href: string };

// Three candidate names for the eyeball experiment. Aurora is the control and must
// reproduce the current site wording; edit taglines/links here without touching JSX.
const BRANDS = {
  aurora: {
    key: 'aurora',
    name: 'Aurora',
    tagline: 'Soft color, like light across a northern sky.',
    href: 'https://en.wikipedia.org/wiki/Aurora',
  },
  fovea: {
    key: 'fovea',
    name: 'Fovea',
    tagline: "Tuned for the eye's sharpest vision.",
    href: 'https://en.wikipedia.org/wiki/Fovea_centralis',
  },
  candela: {
    key: 'candela',
    name: 'Candela',
    tagline: 'Light, measured for tired eyes.',
    href: 'https://en.wikipedia.org/wiki/Candela',
  },
} as const satisfies Record<string, Brand>;

// Reads ?name=; unknown/absent/empty -> aurora (the control). Client-side only.
export function activeBrand(): Brand {
  const key = new URLSearchParams(window.location.search).get('name')?.toLowerCase() ?? '';
  return (BRANDS as Record<string, Brand>)[key] ?? BRANDS.aurora;
}

// Appends the active brand's ?name= to an internal href; aurora returns it unchanged
// (clean URLs). Inserts the query before any #hash and picks ? vs & so it composes with
// existing query strings like the /editor?theme=<id> deep-links from task 025.
export function withBrand(href: string): string {
  const brand = activeBrand();
  if (brand.key === 'aurora') return href;
  const [base, hash] = href.split('#');
  const sep = base.includes('?') ? '&' : '?';
  return `${base}${sep}name=${brand.key}${hash ? `#${hash}` : ''}`;
}
