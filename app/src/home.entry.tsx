import { StrictMode } from 'react';
import { Home } from './Home';
import { mountOrHydrate } from './mount';
import { ShotView } from './ShotView';
import './styles.css';

// The shot-mode handshake stays at the site root: scripts/screenshots.mjs loads
// /?theme=<id>&shot=1, so the home entry renders a single chrome-free card there.
const params = new URLSearchParams(window.location.search);

mountOrHydrate(
  document.getElementById('root')!,
  <StrictMode>
    {params.get('shot') === '1' ? <ShotView id={params.get('theme') ?? ''} /> : <Home />}
  </StrictMode>,
);
