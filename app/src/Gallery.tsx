import { useEffect, useMemo, useState } from 'react';
import { themes } from './themes';
import { ThemeCard } from './ThemeCard';
import { PANE_ORDER, DEFAULT_PANES, type PaneKey } from './samples/Panes';

const ALL_TAGS = [...new Set(themes.flatMap((t) => t.tags))].sort();

function matchesQuery(theme: (typeof themes)[number], query: string) {
  const haystack = [theme.name, theme.tone, ...theme.tags, theme.fonts.code, theme.fonts.prose]
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
  const [tags, setTags] = useState<Set<string>>(() => new Set());
  const [panes, setPanes] = useState<Set<PaneKey>>(() => new Set(DEFAULT_PANES));
  useAnchorFlash();

  const toggleTag = (tag: string) =>
    setTags((prev) => {
      const next = new Set(prev);
      next.has(tag) ? next.delete(tag) : next.add(tag);
      return next;
    });

  const togglePane = (key: PaneKey) =>
    setPanes((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const normalizedQuery = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      themes.filter(
        (t) =>
          (mode === 'all' || t.mode === mode) &&
          (tags.size === 0 || [...tags].every((tag) => t.tags.includes(tag))) &&
          (normalizedQuery === '' || matchesQuery(t, normalizedQuery)),
      ),
    [normalizedQuery, mode, tags],
  );

  return (
    <>
      <div className="gallery-filters">
        <input
          type="search"
          className="filter-search"
          placeholder="Search name, tone, or font…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Search themes"
        />
        <label className="filter-select">
          Mode
          <select value={mode} onChange={(e) => setMode(e.target.value as typeof mode)}>
            <option value="all">All</option>
            <option value="light">Light</option>
            <option value="dark">Dark</option>
          </select>
        </label>
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
        <fieldset className="pane-toggles">
          <legend>Previews</legend>
          {PANE_ORDER.map((p) => (
            <label key={p.key}>
              <input
                type="checkbox"
                checked={panes.has(p.key)}
                onChange={() => togglePane(p.key)}
              />
              {p.label}
            </label>
          ))}
        </fieldset>
      </div>

      {visible.length === 0 ? (
        <p className="gallery-empty">No themes match these filters.</p>
      ) : (
        visible.map((t) => (
          <ThemeCard key={t.id} theme={t} panes={panes} customizeHref={`/editor?theme=${t.id}`} />
        ))
      )}
    </>
  );
}
