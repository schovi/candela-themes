import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './SiteShell';
import { Playground } from './Playground';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteShell page="editor">
      <Playground />
    </SiteShell>
  </StrictMode>,
);
