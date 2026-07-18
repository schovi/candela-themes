import { SiteShell } from './SiteShell';
import { activeBrand, withBrand } from './branding';
import { themes, lightThemes, darkThemes, themeVars, type Theme } from './themes';

const REPO = 'https://github.com/schovi/aurora-themes';

// One line of token-colored sample code in the theme's own colors + code font.
function TinyPreview({ theme }: { theme: Theme }) {
  return (
    <div className="home-preview" style={{ ...themeVars(theme), background: 'var(--bg)' }}>
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
    <a className="home-card" href={withBrand(`/themes#${theme.id}`)}>
      <div className="home-card-head">
        <span className="home-card-name">{theme.name}</span>
        <span className="home-card-tone">{theme.tone}</span>
      </div>
      <TinyPreview theme={theme} />
    </a>
  );
}

export function Home() {
  const brand = activeBrand();
  return (
    <SiteShell page="home">
      <section className="hero">
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
        <p className="hero-tagline">
          <a href={brand.href}>{brand.tagline}</a>
        </p>
      </section>

      <section className="how">
        <h2>How it works</h2>
        <p>
          Every palette is authored in one JSON source of truth, then generated into
          terminal and editor formats — iTerm2, Alacritty, Kitty, WezTerm, Ghostty,
          VS Code, JetBrains, Zed, Sublime, Neovim, and Helix.
        </p>
        <p>
          Browse all {themes.length} in the <a href={withBrand('/themes')}>gallery</a>, tweak one in the{' '}
          <a href={withBrand('/editor')}>Theme Editor</a>, or derive your own in the{' '}
          <a href={withBrand('/builder')}>Theme Builder</a>.
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
