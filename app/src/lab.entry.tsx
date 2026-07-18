import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { SiteShell } from './SiteShell';
import { Playground } from './Playground';
import { Guided } from './Guided';
import './styles.css';

// Lab keeps the theme-building tools reachable. Playground/Guided are mounted
// as-is; their rename and final home is task 023.
function Lab() {
  const [tool, setTool] = useState<'playground' | 'guided'>('playground');
  return (
    <SiteShell page="lab">
      <div className="lab-controls">
        <label>
          Tool{' '}
          <select value={tool} onChange={(e) => setTool(e.target.value as typeof tool)}>
            <option value="playground">Playground</option>
            <option value="guided">Guided</option>
          </select>
        </label>
      </div>
      {tool === 'playground' ? <Playground /> : <Guided />}
    </SiteShell>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
