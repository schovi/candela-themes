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
        <div>
          <p className="hero-eyebrow">{themes.length} themes · terminals &amp; editors</p>
          <h1 className="hero-title">
            <a href={brand.href} style={{ color: 'inherit', textDecoration: 'none' }}>{brand.tagline}</a>
          </h1>
          <p className="hero-what">
            {brand.name} is a set of {themes.length} color themes for terminals and editors,
            tuned for eye-strain comfort.
          </p>
          <p className="hero-why">
            For people who like dark mode but can't use it comfortably — prescription
            lenses, astigmatism, glare sensitivity, plain eye strain. Off-white paper (never
            pure white), dark-gray ink (never pure black), and desaturated pastel syntax keep
            the calm, low-contrast feel without the glare. {lightThemes.length} light
            themes and {darkThemes.length} dark companions tuned to the same contrast rules.
          </p>
          <div className="hero-ctas">
            <a className="hero-cta" href="/themes">Browse the gallery</a>
            <a className="hero-cta-alt" href={`${REPO}#install`}>Install from GitHub</a>
          </div>
          <p className="hero-invariants">
            ink : paper ≥ 7:1 (AAA) · every token ≥ 4.5:1 (AA)<br />
            never #ffffff · never #000000
          </p>
        </div>
        <HeroDemo />
      </section>

      <section className="how">
        <h2>How it works</h2>
        <p>
          Every palette is authored in one JSON source of truth, then generated into
          terminal and editor formats — iTerm2, Alacritty, Kitty, WezTerm, Ghostty,
          VS Code, JetBrains, Zed, Sublime, Neovim, and Helix.
        </p>
        <p>
          Browse all {themes.length} in the <a href="/themes">gallery</a>, then fork one or
          build your own in the <a href="/editor">Theme Editor</a>.
        </p>
        <p>
          Install instructions and the full format list live in the{' '}
          <a href={`${REPO}#install`}>README</a> — source on{' '}
          <a href={REPO}>GitHub</a>.
        </p>
      </section>

      <section className="theme-index">
        <h2>All {themes.length} themes</h2>
        <div className="home-grid">
          {themes.map((t) => (
            <ThemeIndexCard key={t.id} theme={t} />
          ))}
        </div>
      </section>
    </SiteShell>
  );
}
