import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { Gallery } from './Gallery';
import { Home } from './Home';
import { SiteShell } from './SiteShell';

export function renderHome() {
  return renderToString(
    <StrictMode>
      <Home />
    </StrictMode>,
  );
}

export function renderThemes() {
  return renderToString(
    <StrictMode>
      <SiteShell page="themes">
        <Gallery />
      </SiteShell>
    </StrictMode>,
  );
}
