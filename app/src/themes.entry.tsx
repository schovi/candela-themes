import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './SiteShell';
import { themes } from './themes';
import { ThemeCard } from './ThemeCard';
import { PANE_ORDER, type PaneKey } from './samples/Panes';
import './styles.css';

// Gallery stub — every theme as a full card, each with an id anchor so home
// links to /themes#<id> land. Filter/anchor logic is task 022.
const ALL_PANES = new Set<PaneKey>(PANE_ORDER.map((p) => p.key));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteShell page="themes">
      {themes.map((t) => (
        <ThemeCard key={t.id} theme={t} panes={ALL_PANES} />
      ))}
    </SiteShell>
  </StrictMode>,
);
