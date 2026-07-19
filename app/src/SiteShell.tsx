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
        <footer className="site-footer site-footer--editor">
          <span>{brand.name} — light themes for tired eyes.</span>
          <a href="https://github.com/schovi/candela-themes">Source on GitHub</a>
        </footer>
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
        <a href="https://github.com/schovi/candela-themes">Source on GitHub</a>
      </footer>
    </div>
  );
}
