import type { ReactNode } from 'react';
import { brand } from './branding';

type Page = 'home' | 'themes' | 'editor';

const NAV: { page: Page; label: string; href: string }[] = [
  { page: 'home', label: 'Home', href: '/' },
  { page: 'themes', label: 'Themes', href: '/themes' },
  { page: 'editor', label: 'Editor', href: '/editor' },
];

// Wordmark + nav, shared so the editor's app bar reuses the same brand and nav
// config as the stacked site header instead of duplicating it.
export function SiteBrandNav({ page }: { page: Page }) {
  return (
    <>
      <a className="wordmark" href="/">
        <img src="/candela-icon.png" alt="" width={24} height={24} />
        {brand.name}
      </a>
      <nav className="site-nav">
        {NAV.map((n) => (
          <a key={n.page} href={n.href} aria-current={page === n.page ? 'page' : undefined}>
            {n.label}
          </a>
        ))}
        <a className="site-nav-github" href="https://github.com/schovi/candela-themes" aria-label="Source on GitHub" title="Source on GitHub">
          <svg viewBox="0 0 16 16" width={18} height={18} aria-hidden="true" fill="currentColor">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0016 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </nav>
    </>
  );
}

// Shared chrome for every page. Cross-page nav is plain <a href> to real static
// files (Cloudflare serves themes.html at /themes) — no router, no SPA.
// The editor is a full-viewport app workspace: it breaks out of the editorial
// column and merges the site header into its own app bar (rendered by
// Playground, which owns the draft state the bar reports), so SiteShell only
// frames it with a full-width main and a slim single-line footer.
export function SiteShell({ page, children }: { page: Page; children: ReactNode }) {
  if (page === 'editor') {
    return (
      <div className="site site--editor">
        <main className="site-main site-main--editor">{children}</main>
      </div>
    );
  }
  return (
    <div className="site">
      <header className="site-header">
        <SiteBrandNav page={page} />
      </header>
      <main className="site-main">{children}</main>
      <footer className="site-footer">
        <span>{brand.name} — light themes for tired eyes.</span>
      </footer>
    </div>
  );
}
