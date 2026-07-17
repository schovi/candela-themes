import { useMemo, useRef, useState } from 'react';
import { ThemeCard } from './ThemeCard';
import { tokenReference, type ColorToken } from './themes';
import {
  deriveTheme, slugify, DEFAULT_CHOICES, SYNTAX_TOKENS,
  type GuidedChoices, type Mood, type SyntaxToken,
} from './derive';
import { PANE_ORDER, type PaneKey } from './samples/Panes';
import { expectedTokens, checkTheme } from '../../lib/rules.js';

const ALL_PANES = new Set<PaneKey>(PANE_ORDER.map((p) => p.key));

// Curated Google Fonts already loaded in index.html — same list the pro
// playground offers, so every choice previews with no extra network work.
const CODE_FONTS = [
  'JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Source Code Pro', 'DM Mono',
  'Space Mono', 'Spline Sans Mono', 'Red Hat Mono', 'Roboto Mono', 'Overpass Mono', 'Comic Code',
];
const PROSE_FONTS = [
  'Source Serif 4', 'IBM Plex Sans', 'Atkinson Hyperlegible', 'Newsreader', 'DM Sans',
  'Work Sans', 'Spline Sans', 'Hanken Grotesk', 'Public Sans', 'Lora',
];

const MOODS: { value: Mood; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'cool', label: 'Cool' },
  { value: 'neutral', label: 'Neutral' },
];

const DIAG_TOKENS: { key: 'error' | 'warning' | 'ok'; label: string }[] = [
  { key: 'error', label: 'error (red)' },
  { key: 'warning', label: 'warning (amber)' },
  { key: 'ok', label: 'ok (green)' },
];

// Rainbow track for the plain hue sliders (diagnostics), matching the wheel.
const HUE_TRACK = 'linear-gradient(90deg, #f00, #ff0, #0f0, #0ff, #00f, #f0f, #f00)';

// A click/drag hue wheel. Angle is measured clockwise from the top so it lines up
// with the CSS conic-gradient below; the marker rides the selected hue.
function HueWheel({ hue, onChange }: { hue: number; onChange: (hue: number) => void }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const pick = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = clientX - (r.left + r.width / 2);
    const dy = clientY - (r.top + r.height / 2);
    const ang = (Math.atan2(dx, -dy) * 180) / Math.PI;
    onChange(Math.round((ang + 360) % 360));
  };
  const rad = (hue * Math.PI) / 180;
  return (
    <div
      className="gd-wheel"
      ref={ref}
      role="slider"
      aria-label="Accent hue"
      aria-valuemin={0}
      aria-valuemax={360}
      aria-valuenow={hue}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); pick(e.clientX, e.clientY); }}
      onPointerMove={(e) => { if (e.buttons) pick(e.clientX, e.clientY); }}
    >
      <div
        className="gd-wheel-marker"
        style={{ left: `${50 + 42 * Math.sin(rad)}%`, top: `${50 - 42 * Math.cos(rad)}%` }}
      />
    </div>
  );
}

export function Guided() {
  const [choices, setChoices] = useState<GuidedChoices>(() => structuredClone(DEFAULT_CHOICES));
  const [selectedAccent, setSelectedAccent] = useState<SyntaxToken>('kw');
  const [copied, setCopied] = useState(false);

  const update = (patch: Partial<GuidedChoices>) => { setCopied(false); setChoices((c) => ({ ...c, ...patch })); };
  const setAccentHue = (token: SyntaxToken, hue: number) =>
    update({ accentHues: { ...choices.accentHues, [token]: hue } });
  const setDiagHue = (token: 'error' | 'warning' | 'ok', hue: number) =>
    update({ diagnosticHues: { ...choices.diagnosticHues, [token]: hue } });

  const draft = useMemo(() => deriveTheme(choices), [choices]);

  const { failures, warnings } = useMemo(() => {
    const expected = expectedTokens(tokenReference) as string[];
    return checkTheme(draft, expected) as { failures: string[]; warnings: string[] };
  }, [draft]);

  const id = slugify(choices.name);
  const json = JSON.stringify(
    { id, name: draft.name, tone: draft.tone, description: draft.description, fonts: draft.fonts, colors: draft.colors },
    null, 2,
  );
  const canExport = failures.length === 0;
  const copy = () => {
    if (!canExport) return;
    navigator.clipboard?.writeText(json).then(() => setCopied(true), () => setCopied(false));
  };

  return (
    <div className="playground guided">
      <aside className="pg-editor">
        <label className="pg-field">Name
          <input value={choices.name} onChange={(e) => update({ name: e.target.value })} />
          <span className="pg-hint">id: {id}</span>
        </label>
        <label className="pg-field">Tone
          <input value={choices.tone} onChange={(e) => update({ tone: e.target.value })} />
        </label>
        <label className="pg-field">Description
          <textarea rows={2} value={choices.description} onChange={(e) => update({ description: e.target.value })} />
        </label>
        <label className="pg-field">Code font
          <select value={choices.fonts.code} onChange={(e) => update({ fonts: { ...choices.fonts, code: e.target.value } })}>
            {CODE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>
        <label className="pg-field">Prose font
          <select value={choices.fonts.prose} onChange={(e) => update({ fonts: { ...choices.fonts, prose: e.target.value } })}>
            {PROSE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </label>

        <fieldset className="pg-group gd-step">
          <legend>1 · Background</legend>
          <div className="gd-moods">
            {MOODS.map((m) => (
              <label key={m.value} className={choices.mood === m.value ? 'gd-mood gd-mood-on' : 'gd-mood'}>
                <input
                  type="radio" name="gd-mood" checked={choices.mood === m.value}
                  onChange={() => update({ mood: m.value })}
                />
                {m.label}
              </label>
            ))}
          </div>
          <label className="gd-slider">
            <span>Darkness</span>
            <input
              type="range" min={0} max={100} value={choices.darkness}
              onChange={(e) => update({ darkness: Number(e.target.value) })}
            />
          </label>
          <p className="gd-note">bg, surface, text and comment shades derive from this, contrast-stepped and valid by construction.</p>
        </fieldset>

        <fieldset className="pg-group gd-step">
          <legend>2 · Accents</legend>
          <HueWheel hue={choices.accentHues[selectedAccent]} onChange={(h) => setAccentHue(selectedAccent, h)} />
          <div className="gd-tokens">
            {SYNTAX_TOKENS.map((token) => (
              <button
                key={token}
                type="button"
                className={selectedAccent === token ? 'gd-token gd-token-on' : 'gd-token'}
                onClick={() => setSelectedAccent(token)}
              >
                <span className="gd-chip" style={{ background: draft.colors[token as ColorToken] }} />
                {token}
              </button>
            ))}
          </div>
          <p className="gd-note">Pick a token, then a hue on the wheel. Chroma is capped desaturated and lightness auto-fits its AA floor on bg.</p>
        </fieldset>

        <fieldset className="pg-group gd-step">
          <legend>3 · Diagnostics</legend>
          {DIAG_TOKENS.map((d) => (
            <label key={d.key} className="gd-slider gd-diag">
              <span className="gd-chip" style={{ background: draft.colors[d.key] }} />
              <span className="gd-diag-label">{d.label}</span>
              <input
                type="range" min={0} max={360} value={choices.diagnosticHues[d.key]}
                style={{ backgroundImage: HUE_TRACK }}
                onChange={(e) => setDiagHue(d.key, Number(e.target.value))}
              />
            </label>
          ))}
          <p className="gd-note">Hues auto-nudge to satisfy the collision rules (error ≠ num, etc.).</p>
        </fieldset>
      </aside>

      <div className="pg-preview">
        <div className="pg-feedback">
          {canExport ? (
            <p className="pg-ok">All hard invariants pass — ready to export.</p>
          ) : (
            <div className="pg-fails">
              <strong>{failures.length} hard rule(s) failing (export blocked):</strong>
              <ul>{failures.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
          )}
          {warnings.length > 0 && (
            <div className="pg-warns">
              <strong>Warnings (allowed at export):</strong>
              <ul>{warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
            </div>
          )}
          <div className="pg-export">
            <button onClick={copy} disabled={!canExport}>{copied ? 'Copied!' : 'Copy theme JSON'}</button>
            {!canExport && <span className="pg-blocked">Adjust choices to clear the failing rules.</span>}
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
