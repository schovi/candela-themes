import { useEffect, useState } from 'react';
import { themes, themesById } from './themes';
import { ThemeCard } from './ThemeCard';
import { Playground } from './Playground';
import { PANE_ORDER, type PaneKey } from './samples/Panes';

type View = 'single' | 'all' | 'playground';

const ALL_PANES = new Set<PaneKey>(PANE_ORDER.map((p) => p.key));

// Screenshot mode: ?theme=<id>&shot=1 renders exactly one card, chrome-free, and
// signals readiness (after fonts load) so scripts/screenshots.mjs can capture it.
function ShotView({ id }: { id: string }) {
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

export default function App() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('shot') === '1') {
    return <ShotView id={params.get('theme') ?? ''} />;
  }

  const [view, setView] = useState<View>('all');
  const [selectedId, setSelectedId] = useState(themes[0].id);
  const [panes, setPanes] = useState<Set<PaneKey>>(new Set(ALL_PANES));

  const togglePane = (key: PaneKey) => {
    setPanes((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const shown = view === 'single' ? themes.filter((t) => t.id === selectedId) : themes;

  return (
    <>
      <header className="app-header">
        <div className="eyebrow">Aurora · Theme Explorer</div>
        <h1>14 light themes for tired eyes</h1>
        <div className="controls">
          <label>
            View{' '}
            <select value={view} onChange={(e) => setView(e.target.value as View)}>
              <option value="all">All themes</option>
              <option value="single">Single theme</option>
              <option value="playground">Playground</option>
            </select>
          </label>
          {view === 'single' && (
            <label>
              Theme{' '}
              <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
                {themes.map((t) => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </label>
          )}
          {view !== 'playground' && (
            <span className="pane-toggles">
              {PANE_ORDER.map((p) => (
                <label key={p.key}>
                  <input type="checkbox" checked={panes.has(p.key)} onChange={() => togglePane(p.key)} />
                  {p.label}
                </label>
              ))}
            </span>
          )}
        </div>
      </header>
      <main>
        {view === 'playground'
          ? <Playground />
          : shown.map((t) => <ThemeCard key={t.id} theme={t} panes={panes} />)}
      </main>
    </>
  );
}
