import type { ReactNode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';

export function mountOrHydrate(root: HTMLElement, children: ReactNode) {
  if (root.hasChildNodes()) {
    hydrateRoot(root, children);
    return;
  }

  createRoot(root).render(children);
}
