import { useEffect, useMemo, useRef, useState } from 'react';
import { themes, tokenReference, type Theme, type ColorToken } from './themes';
import { ThemeCard } from './ThemeCard';
import { autoFix } from './autofix';
import { DEFAULT_PANES, type PaneKey } from './samples/Panes';
import { PanePicker } from './PanePicker';
import { applyPaletteHelper, type PaletteHelper } from './paletteHelpers';
import { DEFAULT_CHOICES, deriveTheme, SYNTAX_TOKENS, type GuidedChoices, type SyntaxToken } from './derive';
// Shared rule module — the exact same invariants scripts/validate.js enforces
// (both import the same lib/ ESM; change a rule once and both reflect it).
import { expectedTokens, checkTheme } from '../../lib/rules.js';
import { contrastRatio, hexToHsl, hslToHex } from '../../lib/colors.js';

// Curated Google Fonts — exactly the families already loaded in index.html, so
// every choice previews immediately with no extra network work.
// A neutral warm-paper starting point that already clears every hard invariant,
// so "start from scratch" opens green rather than buried in failures.
const BLANK_TEMPLATE: Theme = {
  id: 'my-theme',
  name: 'My Theme',
  tone: 'custom',
  tags: ['custom'],
  mode: 'light',
  description: 'A new Candela-style light theme.',
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
const STORAGE_KEY = 'candela-editor-state-v1';
const CODE_FONTS = ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Source Code Pro', 'DM Mono', 'Space Mono', 'Spline Sans Mono', 'Red Hat Mono', 'Roboto Mono', 'Overpass Mono', 'Comic Code'];
const PROSE_FONTS = ['Source Serif 4', 'IBM Plex Sans', 'Atkinson Hyperlegible', 'Newsreader', 'DM Sans', 'Work Sans', 'Spline Sans', 'Hanken Grotesk', 'Public Sans', 'Lora'];
const MOODS = [{ value: 'warm', label: 'Warm' }, { value: 'cool', label: 'Cool' }, { value: 'neutral', label: 'Neutral' }] as const;
const DIAG_TOKENS = [{ key: 'error', label: 'error (red)' }, { key: 'warning', label: 'warning (amber)' }, { key: 'ok', label: 'ok (green)' }] as const;
const HUE_TRACK = 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';
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

type EditorMode = 'simple' | 'pro';
interface StoredState { draft: Theme; choices: GuidedChoices; mode: EditorMode; panes: PaneKey[] }

function HueWheel({ hue, onChange }: { hue: number; onChange: (hue: number) => void }) {
  const element = useRef<HTMLDivElement | null>(null);
  const pick = (clientX: number, clientY: number) => {
    if (!element.current) return;
    const bounds = element.current.getBoundingClientRect();
    const angle = Math.atan2(clientX - bounds.left - bounds.width / 2, -(clientY - bounds.top - bounds.height / 2)) * 180 / Math.PI;
    onChange(Math.round((angle + 360) % 360));
  };
  const radians = hue * Math.PI / 180;
  return <div ref={element} className="gd-wheel" role="slider" aria-label="Accent hue" aria-valuemin={0} aria-valuemax={360} aria-valuenow={hue} onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pick(event.clientX, event.clientY); }} onPointerMove={(event) => { if (event.buttons) pick(event.clientX, event.clientY); }}><div className="gd-wheel-marker" style={{ left: `${50 + 42 * Math.sin(radians)}%`, top: `${50 - 42 * Math.cos(radians)}%` }} /></div>;
}

function validImportedTheme(value: unknown): value is Theme {
  if (!value || typeof value !== 'object') return false;
  const theme = value as Partial<Theme>;
  const tokens = expectedTokens(tokenReference) as ColorToken[];
  return typeof theme.name === 'string' && typeof theme.tone === 'string' &&
    !!theme.fonts && typeof theme.fonts.code === 'string' && typeof theme.fonts.prose === 'string' &&
    !!theme.colors && tokens.every((token) => HEX.test(theme.colors?.[token] ?? ''));
}

function loadStoredState(): StoredState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as StoredState | null;
    return parsed && validImportedTheme(parsed.draft) && (parsed.mode === 'simple' || parsed.mode === 'pro') ? parsed : null;
  } catch { return null; }
}

const ZONE_STEPS = 100;
const ZONE_SHADE = 'rgba(46,125,50,0.28)';

// Contrast-floor failures that name this token as their subject (message shape
// `<token> on <ref> N:1 < M:1`). We attribute by the leading token so a token's
// own lightness is what clears its zone: `ink on surface` belongs to ink, not
// surface — which is why bg/surface/border/selection/cursor/lineHighlight (never
// the subject of a contrast floor) come back with zero and get no shading. Pure
// oracle read: it tracks whatever floors lib/rules.js enforces.
function tokenContrastFails(theme: Theme, expected: ColorToken[], token: string): number {
  const { failures } = checkTheme(theme, expected) as { failures: string[] };
  return failures.filter((f) => f.startsWith(token + ' ') && f.includes(':1 <')).length;
}

// Turn a per-step pass array into a hard-edged CSS gradient (shaded where the
// token clears its floor). Segment loop, not min/max, so a split passing range
// still renders correctly if a non-light bg ever produces one.
function passZoneGradient(pass: boolean[]): string {
  const last = pass.length - 1;
  const parts: string[] = [];
  let i = 0;
  while (i < pass.length) {
    const start = i;
    const passing = pass[i];
    while (i < pass.length && pass[i] === passing) i++;
    const from = (start / last) * 100;
    const to = ((i - 1) / last) * 100;
    const color = passing ? ZONE_SHADE : 'transparent';
    parts.push(`${color} ${from}%`, `${color} ${to}%`);
  }
  return `linear-gradient(90deg, ${parts.join(', ')})`;
}

// Scan this token's lightness (hue/saturation fixed) and shade the sub-range
// where its contrast floor clears. Returns null when every L passes — a token
// with no floor, so no restriction to draw. Mutates `work` in the scan and
// restores it, matching autofix.ts's working-copy pattern.
function lightnessZone(work: Theme, token: ColorToken, expected: ColorToken[]): string | null {
  const original = work.colors[token];
  const { h, s } = hexToHsl(original);
  const pass: boolean[] = [];
  let allPass = true;
  for (let step = 0; step <= ZONE_STEPS; step++) {
    work.colors[token] = hslToHex({ h, s, l: step / ZONE_STEPS });
    const passing = tokenContrastFails(work, expected, token) === 0;
    pass.push(passing);
    if (!passing) allPass = false;
  }
  work.colors[token] = original;
  return allPass ? null : passZoneGradient(pass);
}

function TokenEditor({ token, value, gradient, setColor }: {
  token: ColorToken;
  value: string;
  gradient: string | null;
  setColor: (token: ColorToken, hex: string) => void;
}) {
  const valid = HEX.test(value);
  const { h, s, l } = valid ? hexToHsl(value) : { h: 0, s: 0, l: 0 };
  const setHsl = (part: 'h' | 's' | 'l', v: number) => setColor(token, hslToHex({ h, s, l, [part]: v }));
  return (
    <div className="pg-token-editor">
      <div className="pg-color">
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
      <div className="pg-sliders">
        <label>H</label>
        <input
          type="range" min={0} max={360} value={Math.round(h)} disabled={!valid}
          onChange={(e) => setHsl('h', Number(e.target.value))}
          aria-label={`${token} hue`}
        />
        <label>S</label>
        <input
          type="range" min={0} max={100} value={Math.round(s * 100)} disabled={!valid}
          onChange={(e) => setHsl('s', Number(e.target.value) / 100)}
          aria-label={`${token} saturation`}
        />
        <label>L</label>
        <div className="pg-l-wrap" style={gradient ? { backgroundImage: gradient } : undefined}>
          <input
            type="range" className="pg-l-slider" min={0} max={100} value={Math.round(l * 100)} disabled={!valid}
            onChange={(e) => setHsl('l', Number(e.target.value) / 100)}
            aria-label={`${token} lightness`}
          />
        </div>
      </div>
    </div>
  );
}

// A ?theme=<id> deep-link (from a gallery card's Customize action) preloads the
// Editor with that theme; a missing or unknown id falls back to the blank template.
function initialFork(): { seed: string; theme: Theme } {
  const id = new URLSearchParams(window.location.search).get('theme');
  const match = id ? themes.find((t) => t.id === id) : undefined;
  return match
    ? { seed: match.id, theme: cloneTheme(match) }
    : { seed: 'blank', theme: cloneTheme(BLANK_TEMPLATE) };
}

export function Playground() {
  const initial = useMemo(() => {
    const fork = initialFork();
    const stored = loadStoredState();
    const hasDeepLink = new URLSearchParams(window.location.search).has('theme');
    if (hasDeepLink && stored && !window.confirm('Replace your saved working draft with this theme?')) return stored;
    if (hasDeepLink) return { draft: fork.theme, choices: structuredClone(DEFAULT_CHOICES), mode: 'pro' as const, panes: [...DEFAULT_PANES] };
    return stored ?? { draft: fork.theme, choices: structuredClone(DEFAULT_CHOICES), mode: 'pro' as const, panes: [...DEFAULT_PANES] };
  }, []);
  const [seed, setSeed] = useState(() => initialFork().seed);
  const [draft, setDraft] = useState<Theme>(initial.draft);
  const [choices, setChoices] = useState<GuidedChoices>(initial.choices);
  const [mode, setMode] = useState<EditorMode>(initial.mode);
  const [panes, setPanes] = useState<Set<PaneKey>>(() => new Set(initial.panes));
  const [selectedAccent, setSelectedAccent] = useState<SyntaxToken>('kw');
  const [wizardStep, setWizardStep] = useState(0);
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);
  const helperBaseline = useRef<Theme | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ draft, choices, mode, panes: [...panes] }));
  }, [draft, choices, mode, panes]);

  const reseed = (value: string) => {
    setSeed(value);
    setCopied(false);
    const source = value === 'blank' ? BLANK_TEMPLATE : themes.find((t) => t.id === value)!;
    setDraft(cloneTheme(source));
    setMode('pro');
  };

  const updateChoices = (patch: Partial<GuidedChoices>) => {
    const next = { ...choices, ...patch };
    setChoices(next);
    setDraft(deriveTheme(next));
    setCopied(false);
  };

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    if (next === 'simple' && !window.confirm('Switching to Simple will discard manual token edits and re-derive the palette. Continue?')) return;
    if (next === 'simple') setDraft(deriveTheme(choices));
    setMode(next);
  };

  const reset = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSeed('blank'); setDraft(cloneTheme(BLANK_TEMPLATE)); setChoices(structuredClone(DEFAULT_CHOICES));
    setMode('pro'); setPanes(new Set(DEFAULT_PANES)); setWizardStep(0); setImportError('');
  };

  const runHelper = (helper: PaletteHelper, value: number) => {
    const baseline = helperBaseline.current ?? draft;
    setDraft(applyPaletteHelper(baseline, helper, value / 50));
    setCopied(false);
  };

  const rawJson = JSON.stringify(draft, null, 2);
  const downloadRaw = () => {
    const url = URL.createObjectURL(new Blob([rawJson], { type: 'application/json' }));
    const link = document.createElement('a'); link.href = url; link.download = `${slugify(draft.name)}.json`; link.click();
    URL.revokeObjectURL(url);
  };
  const importRaw = async (file: File | undefined) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!validImportedTheme(parsed)) throw new Error('Theme must include every token as a #rrggbb color.');
      setDraft({ ...parsed, id: parsed.id || slugify(parsed.name), tags: parsed.tags ?? ['custom'], mode: parsed.mode ?? 'light' });
      setMode('pro'); setImportError('');
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Could not import this file.'); }
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

  const passZones = useMemo(() => {
    const expected = expectedTokens(tokenReference) as ColorToken[];
    if (expected.some((t) => !HEX.test(draft.colors[t] ?? ''))) {
      return {} as Record<string, string | null>;
    }
    const work = cloneTheme(draft);
    const zones: Record<string, string | null> = {};
    for (const token of expected) zones[token] = lightnessZone(work, token, expected);
    return zones;
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
    <section className="lab-tool" id="theme-editor">
      <header className="lab-tool-head">
        <h2>Theme Editor</h2>
        <p>
          Edit any theme's tokens by hex or H/S/L slider and watch every contrast and
          invariant check pass or fail live — the same <code>lib/rules.js</code> rules{' '}
          <code>scripts/validate.js</code> gates on. Green means it would ship as-is; a red
          list names each failing rule, and export stays blocked until all pass.
        </p>
      </header>
      <div className="studio-toolbar">
        <div className="studio-starts" role="group" aria-label="Start a theme">
          <label>Fork existing
            <select value={seed} onChange={(event) => reseed(event.target.value)}>
              <option value="blank">Blank template</option>
              {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
            </select>
          </label>
          <button type="button" onClick={() => reseed('blank')}>Blank template</button>
          <button type="button" onClick={() => { reset(); setMode('simple'); setWizardStep(1); }}>Start wizard</button>
          <button type="button" onClick={reset}>Reset / start over</button>
        </div>
        <div className="studio-modes" role="group" aria-label="Editing mode">
          <button type="button" className={mode === 'simple' ? 'is-on' : ''} onClick={() => switchMode('simple')}>Simple</button>
          <button type="button" className={mode === 'pro' ? 'is-on' : ''} onClick={() => switchMode('pro')}>Pro</button>
        </div>
      </div>
      <div className="playground">
      <aside className="pg-editor">
        {mode === 'pro' ? <>
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
            {group.tokens.map((token) => (
              <TokenEditor
                key={token}
                token={token}
                value={draft.colors[token] ?? ''}
                gradient={passZones[token] ?? null}
                setColor={setColor}
              />
            ))}
          </fieldset>
        ))}
        </> : <>
          <label className="pg-field">Name
            <input value={choices.name} onChange={(event) => updateChoices({ name: event.target.value })} />
          </label>
          {(wizardStep === 0 || wizardStep === 1) && <fieldset className="pg-group gd-step">
            <legend>1 · Background</legend>
            <div className="gd-moods">{MOODS.map((mood) => (
              <label key={mood.value} className={choices.mood === mood.value ? 'gd-mood gd-mood-on' : 'gd-mood'}>
                <input type="radio" name="mood" checked={choices.mood === mood.value} onChange={() => updateChoices({ mood: mood.value })} />{mood.label}
              </label>
            ))}</div>
            <label className="gd-slider"><span>Darkness</span><input type="range" min={0} max={100} value={choices.darkness} onChange={(event) => updateChoices({ darkness: Number(event.target.value) })} /></label>
          </fieldset>}
          {(wizardStep === 0 || wizardStep === 2) && <fieldset className="pg-group gd-step">
            <legend>2 · Accents</legend>
            <HueWheel hue={choices.accentHues[selectedAccent]} onChange={(hue) => updateChoices({ accentHues: { ...choices.accentHues, [selectedAccent]: hue } })} />
            <div className="gd-tokens">{SYNTAX_TOKENS.map((token) => <button key={token} type="button" className={selectedAccent === token ? 'gd-token gd-token-on' : 'gd-token'} onClick={() => setSelectedAccent(token)}><span className="gd-chip" style={{ background: draft.colors[token] }} />{token}</button>)}</div>
          </fieldset>}
          {(wizardStep === 0 || wizardStep === 3) && <fieldset className="pg-group gd-step">
            <legend>3 · Diagnostics</legend>
            {DIAG_TOKENS.map((diagnostic) => <label key={diagnostic.key} className="gd-slider gd-diag"><span className="gd-chip" style={{ background: draft.colors[diagnostic.key] }} /><span className="gd-diag-label">{diagnostic.label}</span><input type="range" min={0} max={360} value={choices.diagnosticHues[diagnostic.key]} style={{ backgroundImage: HUE_TRACK }} onChange={(event) => updateChoices({ diagnosticHues: { ...choices.diagnosticHues, [diagnostic.key]: Number(event.target.value) } })} /></label>)}
          </fieldset>}
          {wizardStep > 0 && <div className="wizard-nav"><button type="button" disabled={wizardStep === 1} onClick={() => setWizardStep((step) => step - 1)}>Back</button><button type="button" onClick={() => wizardStep === 3 ? setWizardStep(0) : setWizardStep((step) => step + 1)}>{wizardStep === 3 ? 'Finish wizard' : 'Next'}</button></div>}
        </>}

        <fieldset className="pg-group studio-helpers">
          <legend>Palette helpers</legend>
          {(['contrast', 'saturation', 'warmth', 'darkness'] as PaletteHelper[]).map((helper) => <label key={helper} className="gd-slider"><span>{helper[0].toUpperCase() + helper.slice(1)}</span><input type="range" min={-50} max={50} defaultValue={0} onPointerDown={() => { helperBaseline.current = cloneTheme(draft); }} onFocus={() => { helperBaseline.current ??= cloneTheme(draft); }} onChange={(event) => runHelper(helper, Number(event.target.value))} onPointerUp={(event) => { helperBaseline.current = null; event.currentTarget.value = '0'; }} onBlur={(event) => { helperBaseline.current = null; event.currentTarget.value = '0'; }} /></label>)}
        </fieldset>

        <fieldset className="pg-group studio-raw">
          <legend>Working JSON</legend>
          <button type="button" onClick={downloadRaw}>Download raw JSON</button>
          <label className="raw-import">Import raw JSON<input type="file" accept="application/json,.json" onChange={(event) => { void importRaw(event.target.files?.[0]); event.currentTarget.value = ''; }} /></label>
          {importError && <p className="pg-fails" role="alert">{importError}</p>}
        </fieldset>
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
            <summary>Theme JSON (paste into candela-themes.json → themes[])</summary>
            <pre>{json}</pre>
          </details>
        </div>
        <PanePicker panes={panes} onChange={setPanes} />
        <ThemeCard theme={draft} panes={panes} />
      </div>
      </div>
    </section>
  );
}
