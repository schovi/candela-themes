import { useEffect } from 'react';
import { themesById } from './themes';
import { ThemeCard } from './ThemeCard';
import { DEFAULT_PANES, PANE_ORDER, type PaneKey } from './samples/Panes';

const VALID_PANES = new Set<PaneKey>(PANE_ORDER.map((p) => p.key));

// ?panes=terminal,typescript picks which sample panes to render (ThemeCard fixes
// the order); unknown keys are dropped and an empty/absent list falls back to the
// defaults.
function parsePanes(raw: string | null): Set<PaneKey> {
  const picked = (raw ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter((s): s is PaneKey => VALID_PANES.has(s as PaneKey));
  return new Set(picked.length ? picked : DEFAULT_PANES);
}

// Screenshot mode: ?theme=<id>&shot=1 renders exactly one card, chrome-free, and
// signals readiness (after fonts load) so scripts/screenshots.mjs can capture it.
// Load-bearing handshake: the shot URL stays at the site root and sets
// data-shotReady — screenshots.mjs waits on it.
export function ShotView({
  id,
  panes,
  fill,
  meta = true,
}: {
  id: string;
  panes?: string | null;
  fill?: boolean;
  meta?: boolean;
}) {
  const shotPanes = parsePanes(panes ?? null);
  const theme = themesById.get(id);
  useEffect(() => {
    // ?fill=1 stretches the card to fill the fixed-height viewport (see .shot-fill).
    if (fill) document.documentElement.dataset.shotFill = '1';
    document.fonts.ready.then(() => {
      document.documentElement.dataset.shotReady = '1';
    });
  }, [fill]);
  if (!theme) {
    document.documentElement.dataset.shotReady = 'missing';
    return <div style={{ padding: 40, fontFamily: 'monospace' }}>Unknown theme id: {id}</div>;
  }
  return <ThemeCard theme={theme} panes={shotPanes} showMeta={meta} />;
}
