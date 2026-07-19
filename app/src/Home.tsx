import { useState } from 'react';
import { SiteShell } from './SiteShell';
import { brand } from './branding';
import { themes, lightThemes, darkThemes, themeVars, type Theme } from './themes';
import { SamplePanes } from './samples/Panes';

const REPO = 'https://github.com/schovi/candela-themes';

// One line of token-colored sample code in the theme's own colors + code font.
function TinyPreview({ theme }: { theme: Theme }) {
  return (
    <div className="home-preview">
      <div className="home-swatches">
        {(['bg', 'ink', 'kw', 'str', 'fn', 'num', 'type', 'builtin'] as const).map((token) => (
          <span key={token} className="home-swatch" style={{ background: theme.colors[token] }} title={token} />
        ))}
      </div>
      <pre className="home-code">
        <span style={{ color: 'var(--kw)' }}>def</span>{' '}
        <span style={{ color: 'var(--fn)' }}>total</span>
        <span style={{ color: 'var(--punct)' }}>(</span>
        <span style={{ color: 'var(--type)' }}>cents</span>
        <span style={{ color: 'var(--punct)' }}>)</span>{' '}
        <span style={{ color: 'var(--punct)' }}>=</span>{' '}
        cents <span style={{ color: 'var(--punct)' }}>/</span>{' '}
        <span style={{ color: 'var(--num)' }}>100.0</span>
      </pre>
    </div>
  );
}

function ThemeIndexCard({ theme }: { theme: Theme }) {
  return (
    <a
      className="home-card"
      href={`/themes#${theme.id}`}
      style={{ ...themeVars(theme), background: 'var(--bg)' }}
    >
      <div className="home-card-head">
        <span className="home-card-name">{theme.name}</span>
        <span className="home-card-tone">{theme.tone}</span>
      </div>
      <TinyPreview theme={theme} />
    </a>
  );
}

// The product demoing itself: one real sample pane, repainted live by picking
// a theme swatch.
function HeroDemo() {
  const [theme, setTheme] = useState(themes[0]);
  return (
    <div className="hero-demo" style={{ ...themeVars(theme) }}>
      <SamplePanes panes={new Set(['typescript'])} />
      <div className="hero-swatchbar" role="group" aria-label="Preview a theme">
        {themes.map((t) => (
          <button
            key={t.id}
            className="hero-swatch"
            style={{ background: `linear-gradient(135deg, ${t.colors.bg} 50%, ${t.colors.kw} 50%)` }}
            aria-pressed={t.id === theme.id}
            aria-label={t.name}
            title={t.name}
            onClick={() => setTheme(t)}
          />
        ))}
      </div>
      <p className="hero-demo-caption">
        {theme.name} · {theme.tone} — <a href={`/themes#${theme.id}`}>open in the gallery</a>
      </p>
    </div>
  );
}

export function Home() {
  return (
    <SiteShell page="home">
      <section className="hero">
        <div className="hero-copy">
          <h1 className="home-h1">{brand.tagline}</h1>
          <p className="home-body">
            {lightThemes.length} light and {darkThemes.length} dark themes for terminals and
            editors, tuned so you can read code all day — without the glare of pure white or
            the harshness of pure black.
          </p>
          <div className="hero-ctas">
            <a className="hero-cta" href="/themes">Browse the gallery</a>
            <a className="hero-cta-alt" href={`${REPO}#install`}>Install from GitHub</a>
          </div>
          <p className="home-data hero-invariants">
            ink : paper ≥ 7:1 (AAA) · every token ≥ 4.5:1 (AA)<br />
            never #ffffff · never #000000
          </p>
        </div>
        <HeroDemo />
      </section>

      <section className="why">
        <div className="why-lead">
          <h2 className="home-h2">Why most light themes hurt</h2>
          <p className="home-body">
            They're too bright and too saturated. Candela is for people who like dark mode but
            can't use it comfortably — prescription lenses, astigmatism, glare sensitivity,
            plain eye strain. A few hard rules fix both:
          </p>
          <p className="home-body">
            Every rule is explained, with sources, in{' '}
            <a href={`${REPO}/blob/main/docs/vision-research.md`}>the vision research</a>.
          </p>
        </div>
        <ul className="home-list">
          <li><strong>Soft paper, never pure white.</strong> Off-white backgrounds kill the glare.</li>
          <li><strong>Dark-gray ink, never pure black.</strong> AAA contrast without the harshness.</li>
          <li><strong>Desaturated accents.</strong> Saturated text is what makes astigmatic eyes see colored fringes.</li>
          <li><strong>Blue and orange carry the meaning.</strong> They stay distinct for almost every kind of color blindness.</li>
          <li><strong>Same colors, same meaning, every theme.</strong> Switching never makes you relearn the screen.</li>
        </ul>
      </section>

      <section className="theme-index">
        <h2 className="home-h2">All {themes.length} themes</h2>
        <div className="home-grid">
          {themes.map((t) => (
            <ThemeIndexCard key={t.id} theme={t} />
          ))}
        </div>
        <p className="home-body home-outro">
          Every palette is authored in one JSON source and generated for iTerm2, Alacritty,
          Kitty, WezTerm, Ghostty, VS Code, JetBrains, Zed, Sublime, Neovim, and Helix. Fork
          one or build your own in the <a href="/editor">Theme Editor</a>, or grab install
          instructions from the <a href={`${REPO}#install`}>README</a> on{' '}
          <a href={REPO}>GitHub</a>.
        </p>
      </section>
    </SiteShell>
  );
}
