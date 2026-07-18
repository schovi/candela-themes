import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './SiteShell';
import { Playground } from './Playground';
import { Guided } from './Guided';
import './styles.css';

// The Lab hosts both theme-building tools on one page, each under a clear name
// with a short intro. No switcher — the landing blurb links to each by anchor.
function Lab() {
  return (
    <SiteShell page="lab">
      <section className="lab-intro">
        <p>
          The Lab holds two ways to build an Aurora theme, both previewing live and
          validated against the same invariants <code>scripts/validate.js</code> enforces.
        </p>
        <nav className="lab-links">
          <a href="#theme-editor">Theme Editor</a>
          <a href="#theme-builder">Theme Builder</a>
        </nav>
      </section>
      <Playground />
      <Guided />
    </SiteShell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
