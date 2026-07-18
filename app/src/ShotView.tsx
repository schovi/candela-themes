import { useEffect } from 'react';
import { themesById } from './themes';
import { ThemeCard } from './ThemeCard';
import { PANE_ORDER, type PaneKey } from './samples/Panes';

const ALL_PANES = new Set<PaneKey>(PANE_ORDER.map((p) => p.key));

// Screenshot mode: ?theme=<id>&shot=1 renders exactly one card, chrome-free, and
// signals readiness (after fonts load) so scripts/screenshots.mjs can capture it.
// Load-bearing handshake: the shot URL stays at the site root and sets
// data-shotReady — screenshots.mjs waits on it.
export function ShotView({ id }: { id: string }) {
  const theme = themesById.get(id);
  useEffect(() => {
    document.fonts.ready.then(() => {
      document.documentElement.dataset.shotReady = '1';
    });
  }, []);
  if (!theme) {
    document.documentElement.dataset.shotReady = 'missing';
    return <div style={{ padding: 40, fontFamily: 'monospace' }}>Unknown theme id: {id}</div>;
  }
  return <ThemeCard theme={theme} panes={ALL_PANES} />;
}
