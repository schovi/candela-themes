import type { Theme } from './themes';
import { themeVars } from './themes';
import { SamplePanes, type PaneKey } from './samples/Panes';

export function ThemeCard({ theme, panes }: { theme: Theme; panes: Set<PaneKey> }) {
  return (
    <section id={theme.id} className="theme-card" data-theme-id={theme.id} style={{ ...themeVars(theme), background: 'var(--bg)' }}>
      <div className="card-inner">
        <div className="card-head">
          <h2 style={{ font: "600 30px/1 var(--prose-font), serif", color: 'var(--ink)' }}>{theme.name}</h2>
          <span className="tone-chip">{theme.tone}</span>
        </div>
        <p className="card-desc">{theme.description}</p>
        <div className="swatches">
          {Object.entries(theme.colors).map(([token, hex]) => (
            <span className="swatch" key={token}>
              <span className="chip" style={{ background: hex, border: '1px solid var(--border)' }} />
              {token} {hex}
            </span>
          ))}
        </div>
        <SamplePanes panes={panes} />
      </div>
    </section>
  );
}
