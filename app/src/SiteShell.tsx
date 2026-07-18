import type { ReactNode } from 'react';

type Page = 'home' | 'themes' | 'editor' | 'builder';

const NAV: { page: Page; label: string; href: string }[] = [
  { page: 'home', label: 'Home', href: '/' },
  { page: 'themes', label: 'Themes', href: '/themes' },
  { page: 'editor', label: 'Editor', href: '/editor' },
  { page: 'builder', label: 'Builder', href: '/builder' },
];

// Shared chrome for every page. Cross-page nav is plain <a href> to real static
// files (Cloudflare serves themes.html at /themes) — no router, no SPA.
export function SiteShell({ page, children }: { page: Page; children: ReactNode }) {
  return (
    <div className="site">
      <header className="site-header">
        <a className="wordmark" href="/">Aurora</a>
        <nav className="site-nav">
          {NAV.map((n) => (
            <a key={n.page} href={n.href} aria-current={page === n.page ? 'page' : undefined}>
              {n.label}
            </a>
          ))}
        </nav>
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>Aurora — light themes for tired eyes.</span>
        <a href="https://github.com/schovi/aurora-themes">Source on GitHub</a>
      </footer>
    </div>
  );
}
