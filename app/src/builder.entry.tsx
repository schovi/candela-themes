import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './SiteShell';
import { Guided } from './Guided';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SiteShell page="builder">
      <Guided />
    </SiteShell>
  </StrictMode>,
);
