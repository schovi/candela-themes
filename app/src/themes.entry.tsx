import { StrictMode } from 'react';
import { SiteShell } from './SiteShell';
import { Gallery } from './Gallery';
import { mountOrHydrate } from './mount';
import './styles.css';

mountOrHydrate(
  document.getElementById('root')!,
  <StrictMode>
    <SiteShell page="themes">
      <Gallery />
    </SiteShell>
  </StrictMode>,
);
