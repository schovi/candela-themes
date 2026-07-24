import { StrictMode } from 'react';
import { SiteShell } from './SiteShell';
import { Playground } from './Playground';
import { mountOrHydrate } from './mount';
import './styles.css';

mountOrHydrate(
  document.getElementById('root')!,
  <StrictMode>
    <SiteShell page="editor">
      <Playground />
    </SiteShell>
  </StrictMode>,
);
