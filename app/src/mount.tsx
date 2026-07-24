import { useEffect, type ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

// Clears the pre-hydration inert markers (set by the inline guard in each page
// shell) once React has committed — for hydrateRoot that commit is where event
// handlers attach, so lifting it here guarantees the first click after load
// lands on a live handler instead of being silently dropped.
function HydrationGate({ children }: { children: ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.remove('is-hydrating');
    document.getElementById('root')?.removeAttribute('aria-busy');
  }, []);
  return <>{children}</>;
}

export function mountOrHydrate(root: HTMLElement, children: ReactNode) {
  const gated = <HydrationGate>{children}</HydrationGate>;

  if (root.hasChildNodes()) {
    hydrateRoot(root, gated);
    return;
  }

  createRoot(root).render(gated);
}
