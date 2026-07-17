import type { CSSProperties } from 'react';
import type { Theme } from './themes';
import { SamplePanes, type PaneKey } from './samples/Panes';

// Map every theme token to a CSS variable on the card root, plus the code/prose
// fonts, so the samples render straight from the source-of-truth values.
function themeVars(theme: Theme): CSSProperties {
  const vars: Record<string, string> = {
    '--code-font': `'${theme.fonts.code}'`,
    '--prose-font': `'${theme.fonts.prose}'`,
  };
  for (const [token, hex] of Object.entries(theme.colors)) {
    vars[`--${token}`] = hex;
  }
  return vars as CSSProperties;
}

export function ThemeCard({ theme, panes }: { theme: Theme; panes: Set<PaneKey> }) {
  return (
    <section className="theme-card" data-theme-id={theme.id} style={{ ...themeVars(theme), background: 'var(--bg)' }}>
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
