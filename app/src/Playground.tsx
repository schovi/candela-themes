import { useMemo, useState } from 'react';
import { themes, tokenReference, type Theme, type ColorToken } from './themes';
import { ThemeCard } from './ThemeCard';
import { autoFix } from './autofix';
import { PANE_ORDER, type PaneKey } from './samples/Panes';
// Shared rule module — the exact same invariants scripts/validate.js enforces
// (both import the same lib/ ESM; change a rule once and both reflect it).
import { expectedTokens, checkTheme } from '../../lib/rules.js';
import { contrastRatio } from '../../lib/colors.js';

const ALL_PANES = new Set<PaneKey>(PANE_ORDER.map((p) => p.key));

// Curated Google Fonts — exactly the families already loaded in index.html, so
// every choice previews immediately with no extra network work.
const CODE_FONTS = [
  'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Source Code Pro', 'DM Mono',
  'Space Mono', 'Spline Sans Mono', 'Red Hat Mono', 'Roboto Mono', 'Overpass Mono',
  // Not a Google Font: previews for anyone with it installed, else falls back to monospace.
  'Comic Code',
];
const PROSE_FONTS = [
  'Source Serif 4', 'IBM Plex Sans', 'Atkinson Hyperlegible', 'Newsreader', 'DM Sans',
  'Work Sans', 'Spline Sans', 'Hanken Grotesk', 'Public Sans', 'Lora',
];

// A neutral warm-paper starting point that already clears every hard invariant,
// so "start from scratch" opens green rather than buried in failures.
const BLANK_TEMPLATE: Theme = {
  id: 'my-theme',
  name: 'My Theme',
  tone: 'custom',
  description: 'A new Aurora-style light theme.',
  fonts: { code: 'JetBrains Mono', prose: 'IBM Plex Sans' },
  colors: {
    bg: '#f4f2ee', surface: '#fbfaf7', border: '#dcd8d0',
    ink: '#2b2a27', ink2: '#5c5a54', faint: '#8f8c84',
    selection: '#e6e1d6', cursor: '#2b2a27', lineHighlight: '#f0ede6',
    kw: '#8a5a2b', str: '#5a7d4a', fn: '#3a6ea5', num: '#a05a3a',
    type: '#7a5aa5', builtin: '#2f8f8f', punct: '#6b6862',
    error: '#b5442f', warning: '#9a7420', ok: '#5a7d4a',
  },
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const TOKEN_GROUPS: { label: string; tokens: ColorToken[] }[] = [
  { label: 'UI', tokens: Object.keys(tokenReference.ui) as ColorToken[] },
  { label: 'Syntax', tokens: Object.keys(tokenReference.syntax) as ColorToken[] },
  { label: 'Diagnostics', tokens: Object.keys(tokenReference.diagnostics) as ColorToken[] },
];

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'my-theme';
}

function cloneTheme(t: Theme): Theme {
  return { ...t, fonts: { ...t.fonts }, colors: { ...t.colors } };
}

export function Playground() {
  const [seed, setSeed] = useState('blank');
  const [draft, setDraft] = useState<Theme>(() => cloneTheme(BLANK_TEMPLATE));
  const [copied, setCopied] = useState(false);

  const reseed = (value: string) => {
    setSeed(value);
    setCopied(false);
    const source = value === 'blank' ? BLANK_TEMPLATE : themes.find((t) => t.id === value)!;
    setDraft(cloneTheme(source));
  };

  const setColor = (token: ColorToken, hex: string) => {
    setCopied(false);
    setDraft((d) => ({ ...d, colors: { ...d.colors, [token]: hex } }));
  };
  const setField = <K extends 'name' | 'tone' | 'description'>(field: K, value: string) => {
    setCopied(false);
    setDraft((d) => ({ ...d, [field]: value }));
  };
  const setFont = (which: 'code' | 'prose', value: string) => {
    setCopied(false);
    setDraft((d) => ({ ...d, fonts: { ...d.fonts, [which]: value } }));
  };

  const { failures, warnings, contrast } = useMemo(() => {
    const expected = expectedTokens(tokenReference) as string[];
    const badHex = expected.filter((t) => !HEX.test(draft.colors[t as ColorToken] ?? ''));
    if (badHex.length) {
      // Guard the shared module (it throws on non-#rrggbb input): report format
      // errors ourselves rather than run the real invariants on garbage.
      return {
        failures: badHex.map((t) => `${t} is not a #rrggbb hex color`),
        warnings: [] as string[],
        contrast: [] as { token: string; onBg: number; onSurface: number }[],
      };
    }
    const result = checkTheme(draft, expected) as { failures: string[]; warnings: string[] };
    const contrast = expected.map((t) => ({
      token: t,
      onBg: contrastRatio(draft.colors[t as ColorToken], draft.colors.bg),
      onSurface: contrastRatio(draft.colors[t as ColorToken], draft.colors.surface),
    }));
    return { failures: result.failures, warnings: result.warnings, contrast };
  }, [draft]);

  const id = slugify(draft.name);
  const exportEntry = {
    id,
    name: draft.name,
    tone: draft.tone,
    description: draft.description,
    fonts: draft.fonts,
    colors: draft.colors,
  };
  const json = JSON.stringify(exportEntry, null, 2);
  const canExport = failures.length === 0;

  const copy = () => {
    if (!canExport) return;
    navigator.clipboard?.writeText(json).then(() => setCopied(true), () => setCopied(false));
  };

  return (
    <div className="playground">
      <aside className="pg-editor">
        <label className="pg-field">
          Start from
          <select value={seed} onChange={(e) => reseed(e.target.value)}>
            <option value="blank">Blank template</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>Fork · {t.name}</option>
            ))}
          </select>
        </label>

        <label className="pg-field">Name
          <input value={draft.name} onChange={(e) => setField('name', e.target.value)} />
          <span className="pg-hint">id: {id}</span>
        </label>
        <label className="pg-field">Tone
          <input value={draft.tone} onChange={(e) => setField('tone', e.target.value)} />
        </label>
        <label className="pg-field">Description
          <textarea rows={2} value={draft.description} onChange={(e) => setField('description', e.target.value)} />
        </label>
        <label className="pg-field">Code font
          <select value={draft.fonts.code} onChange={(e) => setFont('code', e.target.value)}>
            {CODE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="pg-field">Prose font
          <select value={draft.fonts.prose} onChange={(e) => setFont('prose', e.target.value)}>
            {PROSE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        {TOKEN_GROUPS.map((group) => (
          <fieldset key={group.label} className="pg-group">
            <legend>{group.label}</legend>
            {group.tokens.map((token) => {
              const value = draft.colors[token] ?? '';
              const valid = HEX.test(value);
              return (
                <div className="pg-color" key={token}>
                  <input
                    type="color"
                    value={valid ? value : '#000000'}
                    onChange={(e) => setColor(token, e.target.value)}
                    aria-label={`${token} color`}
                  />
                  <span className="pg-token">{token}</span>
                  <input
                    className={valid ? 'pg-hex' : 'pg-hex pg-hex-bad'}
                    value={value}
                    onChange={(e) => setColor(token, e.target.value)}
                    aria-label={`${token} hex`}
                  />
                </div>
              );
            })}
          </fieldset>
        ))}
      </aside>

      <div className="pg-preview">
        <div className="pg-feedback">
          {failures.length === 0 ? (
            <p className="pg-ok">All hard invariants pass — ready to export.</p>
          ) : (
            <div className="pg-fails">
              <div className="pg-fails-head">
                <strong>{failures.length} hard rule(s) failing (export blocked):</strong>
                <button
                  className="pg-fix"
                  onClick={() => { setDraft((d) => autoFix(d)); setCopied(false); }}
                  title="Adjusts each failing color's lightness (keeping hue) to the nearest passing value"
                >
                  Auto-fix colors
                </button>
              </div>
              <ul>{failures.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="pg-warns">
              <strong>Warnings (allowed at export):</strong>
              <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          {contrast.length > 0 && (
            <details className="pg-contrast">
              <summary>Per-token contrast (vs bg / surface)</summary>
              <table>
                <thead><tr><th>token</th><th>on bg</th><th>on surface</th></tr></thead>
                <tbody>
                  {contrast.map((c) => (
                    <tr key={c.token}>
                      <td>{c.token}</td>
                      <td>{c.onBg.toFixed(2)}:1</td>
                      <td>{c.onSurface.toFixed(2)}:1</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
          <div className="pg-export">
            <button onClick={copy} disabled={!canExport}>
              {copied ? 'Copied!' : 'Copy theme JSON'}
            </button>
            {!canExport && <span className="pg-blocked">Fix the failing rules to enable export.</span>}
          </div>
          <details className="pg-json">
            <summary>Theme JSON (paste into aurora-themes.json → themes[])</summary>
            <pre>{json}</pre>
          </details>
        </div>
        <ThemeCard theme={draft} panes={ALL_PANES} />
      </div>
    </div>
  );
}
