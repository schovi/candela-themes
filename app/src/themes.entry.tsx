import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './SiteShell';
import { Gallery } from './Gallery';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteShell page="themes">
      <Gallery />
    </SiteShell>
  </StrictMode>,
);
