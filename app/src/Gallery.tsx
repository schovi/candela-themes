import { useEffect, useMemo, useState } from 'react';
import { themes, usedCategories, CATEGORY_BLURB, type ThemeCategory } from './themes';
import { ThemeCard } from './ThemeCard';
import { DEFAULT_PANES, type PaneKey } from './samples/Panes';
import { PanePicker } from './PanePicker';

const ALL_TAGS = [...new Set(themes.flatMap((t) => t.tags))].sort();

function matchesQuery(theme: (typeof themes)[number], query: string) {
  const haystack = [theme.name, theme.tone, theme.category, ...theme.tags, theme.fonts.code, theme.fonts.prose]
    .join(' ')
    .toLowerCase();
  return haystack.includes(query);
}

// Landing on /themes#<id> scrolls the card into view and briefly highlights it.
// React mounts after the HTML is parsed, so the browser's native anchor jump
// misses (the element does not exist yet) — do it here once the cards render.
function useAnchorFlash() {
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (!id) return;
    let timer = 0;
    // Wait for web fonts before scrolling: they reflow the tall sample panes
    // after mount, which would strand an earlier scroll at the wrong offset.
    document.fonts.ready.then(() => {
      const el = document.getElementById(id);
      if (!el) return;
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      el.classList.add('anchor-flash');
      timer = window.setTimeout(() => el.classList.remove('anchor-flash'), 1600);
    });
    return () => window.clearTimeout(timer);
  }, []);
}

export function Gallery() {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'all' | 'light' | 'dark'>('all');
  const [category, setCategory] = useState<'all' | ThemeCategory>('all');
  // Derived from `pair`, never stored — a second copy would drift the first time
  // a theme gains or loses a counterpart.
  const [pairedOnly, setPairedOnly] = useState(false);
  const [tags, setTags] = useState<Set<string>>(() => new Set());
  const [panes, setPanes] = useState<Set<PaneKey>>(() => new Set(DEFAULT_PANES));
  useAnchorFlash();

  const toggleTag = (tag: string) =>
    setTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      themes.filter(
        (t) =>
          (mode === 'all' || t.mode === mode) &&
          (category === 'all' || t.category === category) &&
          (!pairedOnly || Boolean(t.pair)) &&
          (tags.size === 0 || [...tags].every((tag) => t.tags.includes(tag))) &&
          (normalizedQuery === '' || matchesQuery(t, normalizedQuery)),
      ),
    [normalizedQuery, mode, category, pairedOnly, tags],
  );

  return (
    <>
      <header className="gallery-head">
        <h1>All {themes.length} themes</h1>
        <p>
          Previewed across a terminal and real code. Filter by kind, mode, or tag; every
          card's <strong>Customize</strong> opens it in the Editor.
        </p>
      </header>
      <div className="gallery-filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Search name, tone, or font…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search themes"
        />
        <div className="filter-select">
          Mode
          <div className="pg-segmented" role="group" aria-label="Filter by mode">
            {(['all', 'light', 'dark'] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={mode === value ? 'is-on' : ''}
                aria-pressed={mode === value}
                onClick={() => setMode(value)}
              >
                {value === 'all' ? 'All' : value === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
        <div className="filter-select">
          Kind
          <div className="pg-segmented" role="group" aria-label="Filter by kind">
            {(['all', ...usedCategories] as const).map((value) => (
              <button
                key={value}
                type="button"
                className={category === value ? 'is-on' : ''}
                aria-pressed={category === value}
                title={value === 'all' ? 'Every kind of theme' : CATEGORY_BLURB[value]}
                onClick={() => setCategory(value)}
              >
                {value === 'all' ? 'All' : value}
              </button>
            ))}
          </div>
        </div>
        <button
          type="button"
          className={`tag-chip${pairedOnly ? ' is-on' : ''}`}
          aria-pressed={pairedOnly}
          title="Themes designed as a light/dark set. Most themes ship in one mode only, and that is not a gap."
          onClick={() => setPairedOnly((on) => !on)}
        >
          comes in light and dark
        </button>
        <span className="filter-count">
          {visible.length} of {themes.length} themes
        </span>
        <div className="tag-filters" role="group" aria-label="Filter by tag">
          {ALL_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`tag-chip${tags.has(tag) ? ' is-on' : ''}`}
              aria-pressed={tags.has(tag)}
              onClick={() => toggleTag(tag)}
            >
              {tag}
            </button>
          ))}
          {tags.size > 0 && (
            <button type="button" className="tag-clear" onClick={() => setTags(new Set())}>
              clear
            </button>
          )}
        </div>
        <PanePicker panes={panes} onChange={setPanes} />
        {category !== 'all' && <p className="gallery-kind-blurb">{CATEGORY_BLURB[category]}</p>}
      </div>

      {visible.length === 0 ? (
        <p className="gallery-empty">
          No themes match these filters.{' '}
          <button type="button" className="gallery-empty-clear" onClick={() => { setQuery(''); setMode('all'); setCategory('all'); setPairedOnly(false); setTags(new Set()); }}>
            Clear them
          </button>{' '}
          to see all {themes.length}.
        </p>
      ) : (
        visible.map((t) => (
          <ThemeCard key={t.id} theme={t} panes={panes} customizeHref={`/editor?theme=${t.id}`} />
        ))
      )}
    </>
  );
}
