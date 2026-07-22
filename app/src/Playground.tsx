import { useEffect, useMemo, useRef, useState } from 'react';
import { themes, themeVars, tokenReference, type Theme, type ColorToken } from './themes';
import { ThemeCard } from './ThemeCard';
import { autoFix } from './autofix';
import { DEFAULT_PANES, type PaneKey } from './samples/Panes';
import { PanePicker } from './PanePicker';
import { ExportControls } from './ExportControls';
import { SiteBrandNav } from './SiteShell';
import { Dialog } from './Dialog';
import { applyPaletteHelperValues, type PaletteHelper, type PaletteHelperValues } from './paletteHelpers';
import { ACCENT_L, ACCENT_SAT, DEFAULT_CHOICES, DIAG, MOOD_BG, deriveChoices, deriveTheme, slugify, SYNTAX_TOKENS, type GuidedChoices, type SyntaxToken } from './derive';
import { decodeSharedDraft, encodeSharedDraft, type SharedDraft, type SharedDraftMode } from './shareDraft';
// Shared rule module — the exact same invariants scripts/validate.js enforces
// (both import the same lib/ ESM; change a rule once and both reflect it).
import { AA_CONTRAST, AAA_CONTRAST, expectedTokens, checkTheme } from '../../lib/rules.js';
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
    ink: '#2b2a27', ink2: '#5c5a54', faint: '#706d66',
    selection: '#e6e1d6', cursor: '#2b2a27', lineHighlight: '#f0ede6',
    kw: '#8a5a2b', str: '#557746', fn: '#3a6ea5', num: '#a05a3a',
    type: '#7a5aa5', builtin: '#277777', punct: '#6b6862',
    error: '#b5442f', warning: '#8b691d', ok: '#557746',
  },
};

const HEX = /^#[0-9a-fA-F]{6}$/;
const STORAGE_KEY = 'candela-editor-state-v1';
const CODE_FONTS = ['JetBrains Mono', 'IBM Plex Mono', 'Fira Code', 'Source Code Pro', 'DM Mono', 'Space Mono', 'Spline Sans Mono', 'Red Hat Mono', 'Roboto Mono', 'Overpass Mono', 'Comic Code'];
const PROSE_FONTS = ['Source Serif 4', 'IBM Plex Sans', 'Atkinson Hyperlegible', 'Newsreader', 'DM Sans', 'Work Sans', 'Spline Sans', 'Hanken Grotesk', 'Public Sans', 'Lora'];
const MOODS = [{ value: 'warm', label: 'Warm' }, { value: 'cool', label: 'Cool' }, { value: 'neutral', label: 'Neutral' }] as const;
const DIAG_TOKENS = [{ key: 'error', label: 'error · errors' }, { key: 'warning', label: 'warning · warnings' }, { key: 'ok', label: 'ok · success' }] as const;
const TOKEN_LABELS: Record<ColorToken, string> = {
  bg: 'background', surface: 'surface', border: 'borders', ink: 'primary text', ink2: 'secondary text',
  faint: 'comments', selection: 'selection', cursor: 'cursor', lineHighlight: 'active line',
  kw: 'keywords', str: 'strings', fn: 'functions', num: 'numbers', type: 'types',
  builtin: 'built-ins', punct: 'punctuation', error: 'errors', warning: 'warnings', ok: 'success',
};
// Channel-true gradient tracks, always rendered at the saturation/lightness the
// control actually produces — never the full-RGB neon band (the anti-fringing rule).
function hueTrack(s: number, l: number): string {
  const stops = Array.from({ length: 13 }, (_, i) => hslToHex({ h: (i * 30) % 360, s, l }));
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}
function satTrack(h: number, l: number): string {
  return `linear-gradient(90deg, ${hslToHex({ h, s: 0, l })}, ${hslToHex({ h, s: 1, l })})`;
}
function lightTrack(h: number, s: number): string {
  const stops = [0, 0.25, 0.5, 0.75, 1].map((l) => hslToHex({ h, s, l }));
  return `linear-gradient(90deg, ${stops.join(', ')})`;
}
const VISION_MODES = [
  { value: 'normal', label: 'Normal' },
  { value: 'grayscale', label: 'Grayscale' },
  { value: 'protan', label: 'Protan' },
  { value: 'deutan', label: 'Deutan' },
] as const;
const TOKEN_GROUPS: { label: string; tokens: ColorToken[] }[] = [
  { label: 'UI', tokens: Object.keys(tokenReference.ui) as ColorToken[] },
  { label: 'Syntax', tokens: Object.keys(tokenReference.syntax) as ColorToken[] },
  { label: 'Diagnostics', tokens: Object.keys(tokenReference.diagnostics) as ColorToken[] },
];

const CONTRAST_CHECKS: { token: ColorToken; background: 'bg' | 'surface' | 'selection'; floor: number }[] = [
  { token: 'ink', background: 'surface', floor: AAA_CONTRAST },
  ...(['kw', 'str', 'fn', 'num', 'type', 'builtin', 'punct', 'error', 'warning', 'ok', 'faint'] as ColorToken[])
    .map((token) => ({ token, background: 'bg' as const, floor: AA_CONTRAST })),
  { token: 'ink', background: 'selection', floor: AA_CONTRAST },
];

function controlGroupForToken(token: string): string {
  if (tokenReference.ui[token]) return 'UI';
  if (tokenReference.syntax[token]) return 'Syntax';
  return 'Diagnostics';
}

function explainRuleMessage(message: string): string | null {
  const invalidHex = message.match(/^(\w+) is not a #rrggbb hex color$/);
  if (invalidHex) return `Enter a six-digit hex color for ${invalidHex[1]} (${controlGroupForToken(invalidHex[1])}).`;
  const missingToken = message.match(/^missing token '(\w+)'$/);
  if (missingToken) return `Restore the ${missingToken[1]} color (${controlGroupForToken(missingToken[1])}).`;
  if (message.includes('is not one of light/dark')) return 'Use Start over and choose a built-in theme or a valid saved draft (Starting point).';
  if (message.startsWith('mode ')) return 'Move Background darkness to the other side of the midpoint (Simple), or adjust bg lightness (UI).';
  if (message.startsWith('tags must ')) return 'Use Start over and choose a built-in theme or a valid saved draft (Starting point).';
  if (message.startsWith('bg is pure ')) return 'Move the bg color away from pure white (UI).';
  if (message.startsWith('surface is pure ')) return 'Move the surface color away from pure white (UI).';
  if (message.startsWith('surface ') && message.includes('not lighter than bg')) return 'Make surface slightly lighter than bg (UI).';
  if (message.startsWith('ink is pure ')) return 'Move the ink color away from pure black (UI).';
  const contrastFailure = message.match(/^(\w+) on (bg|surface|selection) /);
  if (contrastFailure) return `Lighten or darken ${contrastFailure[1]} until it passes (${controlGroupForToken(contrastFailure[1])}).`;
  const collision = message.match(/^diagnostic collision: (\w+) and (\w+) share/);
  if (collision) {
    const groups = [...new Set([controlGroupForToken(collision[1]), controlGroupForToken(collision[2])])].join(' and ');
    return `Choose different colors for ${collision[1]} and ${collision[2]} (${groups}).`;
  }
  if (message.includes('distinct accent hues')) return 'Spread the accent colors across 6–8 distinct hues (Syntax).';
  if (message.startsWith('error/ok grayscale separation')) return 'Your error red and success green look too similar in grayscale. Lighten or darken one of them (Diagnostics).';
  if (message.startsWith('error/ok protan/deutan distance')) return 'Your error red and success green may look too similar with red-green color blindness. Change one hue (Diagnostics).';
  return null;
}

type VisionMode = typeof VISION_MODES[number]['value'];

function warningVisionMode(message: string): VisionMode | null {
  if (message.startsWith('error/ok grayscale separation')) return 'grayscale';
  if (message.startsWith('error/ok protan/deutan distance')) return 'protan';
  if (message.includes('purple') && message.includes('blue')) return 'deutan';
  return null;
}

// The rail control a rule/warning names, so its inspector row can jump there.
// Matches the message shapes lib/rules.js emits (plus our own hex-format error);
// null for messages that name no single token (invalid mode/tags, hue count).
function jumpTokenForMessage(message: string): ColorToken | null {
  const patterns = [
    /^missing token '(\w+)'$/,
    /^(\w+) is not a #rrggbb hex color$/,
    /^(\w+) on (?:bg|surface|selection) /,
    /^(\w+) is pure #/,
    /^(surface) #[0-9a-f]{6} not lighter than /,
    /^diagnostic collision: (\w+) and /,
  ];
  for (const pattern of patterns) {
    const match = message.match(pattern);
    if (match) return match[1] as ColorToken;
  }
  if (message.includes('requires bg lightness')) return 'bg';
  if (message.startsWith('error/ok ')) return 'error';
  return null;
}

function RuleMessageText({ message }: { message: string }) {
  const explanation = explainRuleMessage(message);
  return <>
    {explanation && <span className="pg-rule-explanation">{explanation}</span>}
    <span className={explanation ? 'pg-rule-technical' : undefined}>{message}</span>
  </>;
}

// One inspector row. When the message names a token, the text becomes a jump
// button to that token's rail controls; the vision-sim button (warnings only)
// stays a sibling so we never nest buttons.
function RuleRow({ message, onJump, onVisionMode }: {
  message: string;
  onJump: (token: ColorToken) => void;
  onVisionMode?: (mode: VisionMode) => void;
}) {
  const token = jumpTokenForMessage(message);
  const visionMode = onVisionMode ? warningVisionMode(message) : null;
  return <li>
    {token
      ? <button type="button" className="pg-rule-jump" onClick={() => onJump(token)}><RuleMessageText message={message} /></button>
      : <RuleMessageText message={message} />}
    {visionMode && onVisionMode && <button className="pg-see-warning" type="button" onClick={() => onVisionMode(visionMode)}>See in {VISION_MODES.find((simulation) => simulation.value === visionMode)?.label}</button>}
  </li>;
}

function VisionFilterDefinitions() {
  return <svg className="vision-filter-definitions" aria-hidden="true">
    <defs>
      <filter id="vision-grayscale" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0.2126 0.7152 0.0722 0 0  0 0 0 1 0" /></filter>
      <filter id="vision-protan" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.11238 0.88762 0 0 0  0.11238 0.88762 0 0 0  0.00401 -0.00401 1 0 0  0 0 0 1 0" /></filter>
      <filter id="vision-deutan" colorInterpolationFilters="sRGB"><feColorMatrix type="matrix" values="0.29275 0.70725 0 0 0  0.29275 0.70725 0 0 0  -0.02234 0.02234 1 0 0  0 0 0 1 0" /></filter>
    </defs>
  </svg>;
}

function cloneTheme(t: Theme): Theme {
  return { ...t, fonts: { ...t.fonts }, colors: { ...t.colors } };
}

type EditorMode = SharedDraftMode;
interface StoredState { draft: Theme; choices: GuidedChoices; mode: EditorMode; panes: PaneKey[] }
interface DraftReplacement { draft: Theme; mode: EditorMode }
interface DraftActivity { verb: 'resumed' | 'saved'; at: number }

function relativeDraftStatus(activity: DraftActivity, now: number): string {
  const minutes = Math.max(0, Math.floor((now - activity.at) / 60_000));
  const prefix = activity.verb === 'resumed' ? 'Last draft resumed' : 'Draft saved';
  return `${prefix} ${minutes === 0 ? 'just now' : `${minutes} min ago`}`;
}

// Calibrated scale: gradient track (channel-true where the axis is a color
// channel), engraved ticks under it, and a mono numeric readout. The optional
// zone overlay (lightness pass range) layers on top of the track gradient.
function GaugeSlider({ label, min, max, value, onChange, track, zone, unit, disabled, ariaLabel, id }: {
  label: string;
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  track?: string;
  zone?: string | null;
  unit?: string;
  disabled?: boolean;
  ariaLabel: string;
  id?: string;
}) {
  const layers = [zone, track].filter(Boolean).join(', ');
  return (
    <div className="gauge">
      <span className="gauge-label" aria-hidden="true">{label}</span>
      <div className={track ? 'gauge-track has-gradient' : 'gauge-track'} style={layers ? { backgroundImage: layers } : undefined}>
        <input
          id={id}
          type="range" min={min} max={max} value={value} disabled={disabled}
          onChange={(event) => onChange(Number(event.target.value))}
          aria-label={ariaLabel}
        />
      </div>
      <output className="gauge-readout">{Math.round(value)}{unit ?? ''}</output>
    </div>
  );
}

// The signature element: an engraved hue dial. The ring is rendered exactly at
// the saturation/lightness band guided accents ship at (never full RGB), with
// degree ticks and every syntax token's hue plotted as a marker on the ring.
const DIAL_RING = `conic-gradient(from 0deg, ${Array.from({ length: 25 }, (_, i) => hslToHex({ h: (i * 15) % 360, s: ACCENT_SAT, l: ACCENT_L })).join(', ')})`;
const DIAL_TICKS = Array.from({ length: 24 }, (_, i) => i * 15);

function HueDial({ hues, selected, colors, onChange }: {
  hues: Record<SyntaxToken, number>;
  selected: SyntaxToken;
  colors: Record<string, string>;
  onChange: (hue: number) => void;
}) {
  const element = useRef<HTMLDivElement | null>(null);
  const hue = hues[selected];
  const pick = (clientX: number, clientY: number) => {
    if (!element.current) return;
    const bounds = element.current.getBoundingClientRect();
    const angle = Math.atan2(clientX - bounds.left - bounds.width / 2, -(clientY - bounds.top - bounds.height / 2)) * 180 / Math.PI;
    onChange(Math.round((angle + 360) % 360));
  };
  const markerStyle = (tokenHue: number) => {
    const radians = tokenHue * Math.PI / 180;
    return { left: `${50 + 39.5 * Math.sin(radians)}%`, top: `${50 - 39.5 * Math.cos(radians)}%` };
  };
  return (
    <div className="gd-dial-wrap">
      <span className="gd-dial-degree gd-dial-degree-n" aria-hidden="true">0°</span>
      <span className="gd-dial-degree gd-dial-degree-e" aria-hidden="true">90°</span>
      <span className="gd-dial-degree gd-dial-degree-s" aria-hidden="true">180°</span>
      <span className="gd-dial-degree gd-dial-degree-w" aria-hidden="true">270°</span>
      <div
        ref={element} className="gd-dial" role="slider" tabIndex={0}
        aria-label={`${selected} hue`} aria-valuemin={0} aria-valuemax={360} aria-valuenow={hue}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); pick(event.clientX, event.clientY); }}
        onPointerMove={(event) => { if (event.buttons) pick(event.clientX, event.clientY); }}
        onKeyDown={(event) => {
          const step = event.key === 'ArrowRight' || event.key === 'ArrowUp' ? 1 : event.key === 'ArrowLeft' || event.key === 'ArrowDown' ? -1 : event.key === 'PageUp' ? 15 : event.key === 'PageDown' ? -15 : 0;
          if (!step) return;
          event.preventDefault();
          onChange((hue + step + 360) % 360);
        }}
      >
        <div className="gd-dial-ring" style={{ background: DIAL_RING }} />
        {DIAL_TICKS.map((angle) => <span key={angle} className={angle % 90 === 0 ? 'gd-dial-tick gd-dial-tick-major' : 'gd-dial-tick'} style={{ transform: `rotate(${angle}deg)` }} />)}
        {SYNTAX_TOKENS.map((token) => (
          <span
            key={token}
            className={token === selected ? 'gd-dial-marker is-selected' : 'gd-dial-marker'}
            style={{ ...markerStyle(hues[token]), background: colors[token] }}
          />
        ))}
        <div className="gd-dial-center" aria-hidden="true">
          <strong>{hue}°</strong>
          <span>{selected}</span>
        </div>
      </div>
    </div>
  );
}

function validImportedTheme(value: unknown): value is Theme {
  if (!value || typeof value !== 'object') return false;
  const theme = value as Partial<Theme>;
  const tokens = expectedTokens(tokenReference) as ColorToken[];
  return typeof theme.name === 'string' && typeof theme.tone === 'string' && (theme.mode === 'light' || theme.mode === 'dark') &&
    Array.isArray(theme.tags) && theme.tags.length > 0 && theme.tags.every((tag) => typeof tag === 'string' && tag.length > 0) &&
    !!theme.fonts && typeof theme.fonts.code === 'string' && typeof theme.fonts.prose === 'string' &&
    !!theme.colors && tokens.every((token) => HEX.test(theme.colors?.[token] ?? ''));
}

function loadStoredState(): StoredState | null {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null') as StoredState | null;
    return parsed && validImportedTheme(parsed.draft) && (parsed.mode === 'simple' || parsed.mode === 'pro') ? parsed : null;
  } catch { return null; }
}

function loadSharedDraft(): { requested: boolean; sharedDraft: SharedDraft | null } {
  const encoded = new URLSearchParams(window.location.hash.slice(1)).get('d');
  if (!encoded) return { requested: false, sharedDraft: null };
  history.replaceState(null, '', window.location.pathname + window.location.search);
  try {
    const parsed = decodeSharedDraft(encoded) as Partial<SharedDraft>;
    return {
      requested: true,
      sharedDraft: validImportedTheme(parsed?.draft) && (parsed.mode === 'simple' || parsed.mode === 'pro')
        ? { draft: parsed.draft, mode: parsed.mode }
        : null,
    };
  } catch {
    return { requested: true, sharedDraft: null };
  }
}

const INITIAL_SHARED_DRAFT = loadSharedDraft();

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

function TokenEditor({ token, value, gradient, open, highlighted, onToggle, setColor, setHighlightedToken }: {
  token: ColorToken;
  value: string;
  gradient: string | null;
  open: boolean;
  highlighted: boolean;
  onToggle: () => void;
  setColor: (token: ColorToken, hex: string) => void;
  setHighlightedToken: (token: ColorToken | null) => void;
}) {
  const [hexInput, setHexInput] = useState(value);
  useEffect(() => setHexInput(value), [value]);
  const valid = HEX.test(hexInput);
  const { h, s, l } = hexToHsl(value);
  const setHsl = (part: 'h' | 's' | 'l', v: number) => setColor(token, hslToHex({ h, s, l, [part]: v }));
  return (
    <div
      className={`pg-token-editor${open ? ' is-open' : ''}${highlighted ? ' rail-hi' : ''}`}
      onPointerEnter={() => setHighlightedToken(token)}
      onPointerLeave={() => setHighlightedToken(null)}
      onFocus={() => setHighlightedToken(token)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setHighlightedToken(null); }}
    >
      <div className="pg-color">
        <input
          type="color"
          value={valid ? value : '#000000'}
          onChange={(e) => setColor(token, e.target.value)}
          aria-label={`${token} color`}
        />
        <button type="button" id={`rail-token-${token}`} className="pg-token-toggle" aria-expanded={open} onClick={onToggle}>
          <span className="pg-token">{token} · {TOKEN_LABELS[token]}</span>
          <span className="pg-token-hsl">{Math.round(h)}° {Math.round(s * 100)} {Math.round(l * 100)}</span>
        </button>
        <input
          className={valid ? 'pg-hex' : 'pg-hex pg-hex-bad'}
          value={hexInput}
          onChange={(event) => {
            const next = event.target.value;
            setHexInput(next);
            if (HEX.test(next)) setColor(token, next);
          }}
          aria-label={`${token} hex`}
        />
      </div>
      {open && <div className="pg-sliders">
        <GaugeSlider label="H" min={0} max={360} value={Math.round(h)} disabled={!valid} unit="°"
          track={hueTrack(s, l)} onChange={(v) => setHsl('h', v)} ariaLabel={`${token} hue`} />
        <GaugeSlider label="S" min={0} max={100} value={Math.round(s * 100)} disabled={!valid}
          track={satTrack(h, l)} onChange={(v) => setHsl('s', v / 100)} ariaLabel={`${token} saturation`} />
        <GaugeSlider label="L" min={0} max={100} value={Math.round(l * 100)} disabled={!valid}
          track={lightTrack(h, s)} zone={gradient} onChange={(v) => setHsl('l', v / 100)} ariaLabel={`${token} lightness`} />
      </div>}
    </div>
  );
}

// A valid ?theme=<id> deep-link (from a gallery card's Customize action) preloads
// the Editor. Missing and unknown ids leave the starting-point choice to the user.
function initialFork(): { seed: string; theme: Theme; validDeepLink: boolean; requestedId: string | null } {
  const id = new URLSearchParams(window.location.search).get('theme');
  const match = id ? themes.find((theme) => theme.id === id || slugify(theme.name) === id) : undefined;
  return match
    ? { seed: match.id, theme: cloneTheme(match), validDeepLink: true, requestedId: id }
    : { seed: themes[0].id, theme: cloneTheme(BLANK_TEMPLATE), validDeepLink: false, requestedId: id };
}

export function Playground() {
  const initial = useMemo(() => {
    const fork = initialFork();
    const stored = loadStoredState();
    const share = INITIAL_SHARED_DRAFT;
    const resumedActivity = stored ? { verb: 'resumed', at: Date.now() } as const : null;
    if (share.sharedDraft && stored) return { ...stored, editing: true, replacement: share.sharedDraft, notice: null, activity: resumedActivity };
    if (share.sharedDraft) return { draft: share.sharedDraft.draft, choices: deriveChoices(share.sharedDraft.draft), mode: share.sharedDraft.mode, panes: [...DEFAULT_PANES], editing: true, replacement: null, notice: null, activity: null };
    if (share.requested) {
      if (stored) return { ...stored, editing: true, replacement: null, notice: 'This share link is damaged or not a Candela theme.', activity: resumedActivity };
      return { draft: fork.theme, choices: structuredClone(DEFAULT_CHOICES), mode: 'pro' as const, panes: [...DEFAULT_PANES], editing: false, replacement: null, notice: 'This share link is damaged or not a Candela theme.', activity: null };
    }
    if (fork.validDeepLink && stored) return { ...stored, editing: true, replacement: { draft: fork.theme, mode: 'pro' as const }, notice: null, activity: resumedActivity };
    if (fork.validDeepLink) return { draft: fork.theme, choices: structuredClone(DEFAULT_CHOICES), mode: 'pro' as const, panes: [...DEFAULT_PANES], editing: true, replacement: null, notice: null, activity: null };
    if (stored) return { ...stored, editing: true, replacement: null, notice: fork.requestedId ? `Theme '${fork.requestedId}' not found.` : null, activity: resumedActivity };
    return { draft: fork.theme, choices: structuredClone(DEFAULT_CHOICES), mode: 'pro' as const, panes: [...DEFAULT_PANES], editing: false, replacement: null, notice: fork.requestedId ? `Theme '${fork.requestedId}' not found.` : null, activity: null };
  }, []);
  const [seed, setSeed] = useState(() => initialFork().seed);
  const [draft, setDraft] = useState<Theme>(initial.draft);
  const [choices, setChoices] = useState<GuidedChoices>(initial.choices);
  const [mode, setMode] = useState<EditorMode>(initial.mode);
  const [panes, setPanes] = useState<Set<PaneKey>>(() => new Set(initial.panes));
  const [editing, setEditing] = useState(initial.editing);
  const [replacement, setReplacement] = useState<DraftReplacement | null>(initial.replacement);
  const [notice, setNotice] = useState<string | null>(initial.notice);
  const [draftActivity, setDraftActivity] = useState<DraftActivity | null>(initial.activity);
  const [relativeTimeNow, setRelativeTimeNow] = useState(Date.now);
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [startOverDialogOpen, setStartOverDialogOpen] = useState(false);
  const [selectedAccent, setSelectedAccent] = useState<SyntaxToken>('kw');
  const [openToken, setOpenToken] = useState<ColorToken | null>(null);
  const [highlightedToken, setHighlightedToken] = useState<ColorToken | null>(null);
  const [importError, setImportError] = useState('');
  const [copied, setCopied] = useState(false);
  const [shareLinkCopied, setShareLinkCopied] = useState(false);
  const [validationOpenOverride, setValidationOpenOverride] = useState<boolean | null>(null);
  const [visionMode, setVisionMode] = useState<VisionMode>('normal');
  const [helperValues, setHelperValues] = useState<PaletteHelperValues>({ contrast: 0, saturation: 0, warmth: 0, darkness: 0 });
  const helperBaseline = useRef<Theme>(cloneTheme(initial.draft));
  const persistedState = JSON.stringify({ draft, choices, mode, panes: [...panes] });
  const lastPersistedState = useRef(persistedState);

  useEffect(() => {
    if (!editing || persistedState === lastPersistedState.current) return;
    localStorage.setItem(STORAGE_KEY, persistedState);
    lastPersistedState.current = persistedState;
    const savedAt = Date.now();
    setDraftActivity({ verb: 'saved', at: savedAt });
    setRelativeTimeNow(savedAt);
  }, [editing, persistedState]);

  useEffect(() => {
    if (!draftActivity) return;
    const timer = window.setInterval(() => setRelativeTimeNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [draftActivity]);

  useEffect(() => setShareLinkCopied(false), [draft, mode]);

  // The orchestrated moment: a short green sweep when validation flips to
  // all-pass. CSS guards it behind prefers-reduced-motion.
  const [justPassed, setJustPassed] = useState(false);
  const prevFailureCount = useRef<number | null>(null);

  const replaceDraftAndResetHelpers = (next: Theme) => {
    helperBaseline.current = cloneTheme(next);
    setHelperValues({ contrast: 0, saturation: 0, warmth: 0, darkness: 0 });
    setDraft(next);
  };

  const updateDraftAndResetHelpers = (update: (current: Theme) => Theme) => {
    setHelperValues({ contrast: 0, saturation: 0, warmth: 0, darkness: 0 });
    setDraft((current) => {
      const next = update(current);
      helperBaseline.current = cloneTheme(next);
      return next;
    });
  };

  const reseed = (value: string) => {
    setSeed(value);
    setCopied(false);
    const source = value === 'blank' ? BLANK_TEMPLATE : themes.find((t) => t.id === value)!;
    replaceDraftAndResetHelpers(cloneTheme(source));
    setMode('pro');
    setEditing(true);
  };

  const updateChoices = (patch: Partial<GuidedChoices>) => {
    const next = { ...choices, ...patch };
    setChoices(next);
    replaceDraftAndResetHelpers(deriveTheme(next));
    setCopied(false);
  };

  const updateChoiceMetadata = (patch: Partial<Pick<GuidedChoices, 'name' | 'tone' | 'description' | 'fonts'>>) => {
    setChoices((current) => ({ ...current, ...patch }));
    helperBaseline.current = { ...helperBaseline.current, ...patch };
    setDraft((current) => ({ ...current, ...patch }));
    setCopied(false);
  };

  const switchMode = (next: EditorMode) => {
    if (next === mode) return;
    if (next === 'simple') {
      const nextChoices = deriveChoices(draft);
      setChoices(nextChoices);
      replaceDraftAndResetHelpers(deriveTheme(nextChoices));
    }
    setMode(next);
  };

  const startSimple = () => {
    setChoices(structuredClone(DEFAULT_CHOICES));
    replaceDraftAndResetHelpers(deriveTheme(DEFAULT_CHOICES));
    setMode('simple');
    setEditing(true);
  };

  const startOver = () => setStartOverDialogOpen(true);

  const confirmStartOver = () => {
    localStorage.removeItem(STORAGE_KEY);
    setSeed(themes[0].id); replaceDraftAndResetHelpers(cloneTheme(BLANK_TEMPLATE)); setChoices(structuredClone(DEFAULT_CHOICES));
    setMode('pro'); setPanes(new Set(DEFAULT_PANES)); setImportError('');
    setCopied(false); setEditing(false); setNotice(null); setDraftActivity(null); setStartOverDialogOpen(false);
  };

  const openReplacement = () => {
    if (!replacement) return;
    setSeed(replacement.draft.id);
    replaceDraftAndResetHelpers(cloneTheme(replacement.draft));
    setChoices(deriveChoices(replacement.draft));
    setMode(replacement.mode); setPanes(new Set(DEFAULT_PANES)); setImportError('');
    setCopied(false); setEditing(true); setReplacement(null);
  };

  const setHelperValue = (helper: PaletteHelper, value: number) => {
    const next = { ...helperValues, [helper]: value };
    setHelperValues(next);
    setDraft(applyPaletteHelperValues(helperBaseline.current, next));
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
      replaceDraftAndResetHelpers({ ...parsed, id: parsed.id || slugify(parsed.name), tags: parsed.tags ?? ['custom'], mode: parsed.mode ?? 'light' });
      setChoices(structuredClone(DEFAULT_CHOICES)); setMode('pro');
      setCopied(false); setValidationOpenOverride(null); setImportError(''); setEditing(true);
    } catch (error) { setImportError(error instanceof Error ? error.message : 'Could not import this file.'); }
  };

  const setColor = (token: ColorToken, hex: string) => {
    setCopied(false);
    updateDraftAndResetHelpers((current) => ({ ...current, colors: { ...current.colors, [token]: hex } }));
  };
  const setField = <K extends 'name' | 'tone' | 'description'>(field: K, value: string) => {
    setCopied(false);
    updateDraftAndResetHelpers((current) => ({ ...current, [field]: value }));
  };
  const setFont = (which: 'code' | 'prose', value: string) => {
    setCopied(false);
    updateDraftAndResetHelpers((current) => ({ ...current, fonts: { ...current.fonts, [which]: value } }));
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
        contrast: [] as { token: ColorToken; background: 'bg' | 'surface' | 'selection'; floor: number; ratio: number }[],
      };
    }
    const result = checkTheme(draft, expected) as { failures: string[]; warnings: string[] };
    const contrast = CONTRAST_CHECKS.map((check) => ({
      ...check,
      ratio: contrastRatio(draft.colors[check.token], draft.colors[check.background]),
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
    tags: draft.tags?.length ? draft.tags : ['custom'],
    mode: draft.mode,
    description: draft.description,
    fonts: draft.fonts,
    colors: draft.colors,
  };
  const json = JSON.stringify(exportEntry, null, 2);
  const canExport = failures.length === 0;

  useEffect(() => {
    const was = prevFailureCount.current;
    prevFailureCount.current = failures.length;
    if (was !== null && was > 0 && failures.length === 0) {
      setJustPassed(true);
      const timer = setTimeout(() => setJustPassed(false), 1100);
      return () => clearTimeout(timer);
    }
  }, [failures.length]);

  // Inspector → rail: reveal and focus the controls for the named token. Pro
  // opens its disclosure (one-at-a-time via setOpenToken); Simple selects the
  // accent for syntax tokens. UI tokens have no dedicated Simple control, so
  // they route to the Background step. The focus target (toggle button, accent
  // button, or slider) exists in every mode regardless of open/selected state,
  // so we scroll+focus synchronously within the click — no rAF race, and the
  // gesture keeps :focus-visible on for keyboard users. Instant, per 040.
  const jumpToToken = (token: ColorToken) => {
    const isSyntax = (SYNTAX_TOKENS as string[]).includes(token);
    if (mode === 'pro') setOpenToken(token);
    else if (isSyntax) setSelectedAccent(token as SyntaxToken);
    const target = mode === 'pro' || isSyntax || ['error', 'warning', 'ok'].includes(token) ? token : 'bg';
    const element = document.getElementById(`rail-token-${target}`);
    if (!element) return;
    element.scrollIntoView({ block: 'nearest' });
    element.focus();
  };

  // Preview → rail: clicking a tokenized sample element reveals its controls
  // (reuses jumpToToken), hovering glows it (reuses setHighlightedToken via the
  // card's data-highlight). Delegated off the preview wrapper so the ~100s of
  // token spans stay non-tabbable — the rail is the keyboard path (043).
  const tokenAtPreviewEvent = (event: React.SyntheticEvent): ColorToken | null => {
    const token = (event.target as HTMLElement).closest('[data-token]')?.getAttribute('data-token');
    return token && token in draft.colors ? (token as ColorToken) : null;
  };
  // Which tokens a preview click can actually land on. Pro has an editor per
  // token; Simple only exposes the accents, the diagnostics, and the background
  // (darkness) — its other UI tokens are derived, with no knob to reveal. Gating
  // here keeps jumpToToken's inspector-only `bg` fallback from firing on a
  // preview click and teleporting to the darkness slider.
  const previewReachable = (token: ColorToken): boolean =>
    mode === 'pro'
    || (SYNTAX_TOKENS as string[]).includes(token)
    || ['error', 'warning', 'ok', 'bg'].includes(token);
  const inspectFromPreview = (event: React.MouseEvent) => {
    const token = tokenAtPreviewEvent(event);
    if (token && previewReachable(token)) jumpToToken(token);
  };
  // Glow and the pointer cursor both track reachability, so a token only looks
  // clickable (hand + highlight) when a click would actually reveal a control.
  const highlightFromPreview = (event: React.PointerEvent<HTMLDivElement>) => {
    const token = tokenAtPreviewEvent(event);
    const reachable = !!token && previewReachable(token);
    setHighlightedToken(reachable ? token : null);
    event.currentTarget.style.cursor = reachable ? 'pointer' : '';
  };
  const clearPreviewHighlight = (event: React.PointerEvent<HTMLDivElement>) => {
    setHighlightedToken(null);
    event.currentTarget.style.cursor = '';
  };

  const copy = () => {
    if (!canExport) return;
    navigator.clipboard?.writeText(json).then(() => setCopied(true), () => setCopied(false));
  };

  const copyShareLink = () => {
    const url = new URL(window.location.href);
    url.hash = `d=${encodeSharedDraft({ draft, mode })}`;
    navigator.clipboard?.writeText(url.toString()).then(() => setShareLinkCopied(true), () => setShareLinkCopied(false));
  };

  return (
    <section className="lab-tool" id="theme-editor">
      <header className="app-bar">
        <SiteBrandNav page="editor" />
        {editing && <div className="app-bar-studio">
          <div className="studio-bar-actions">
            {draftActivity && <span className="studio-draft-status">{relativeDraftStatus(draftActivity, relativeTimeNow)}</span>}
            <button className="studio-export-trigger" type="button" aria-haspopup="dialog" aria-expanded={exportDialogOpen} onClick={() => setExportDialogOpen(true)}>
              Save &amp; Export
              <svg className="studio-export-chevron" aria-hidden="true" viewBox="0 0 12 8">
                <path d="m1 1 5 5 5-5" />
              </svg>
            </button>
            <button className="studio-start-over" type="button" onClick={startOver}>Start over</button>
          </div>
        </div>}
      </header>
      {notice && <div className="studio-notice" role="status">
        <span>{notice}{notice.startsWith('Resuming') && ' — '}</span>
        {notice.startsWith('Resuming') && <button type="button" onClick={startOver}>Start fresh?</button>}
        <button className="studio-notice-dismiss" type="button" aria-label="Dismiss notice" onClick={() => setNotice(null)}>×</button>
      </div>}
      {!editing ? <div className="editor-workspace editor-workspace--welcome"><div className="studio-welcome">
        <div className="studio-welcome-head">
          <h3>How would you like to begin?</h3>
          <p>Choose a starting point. You can switch between Simple and Pro editing later.</p>
        </div>
        <div className="studio-start-options">
          <button className="studio-start-card" type="button" onClick={() => reseed('blank')}>
            <strong>Blank theme</strong>
            <span>Start with a balanced neutral palette and edit every detail.</span>
          </button>
          <div className="studio-start-card studio-fork-card">
            <strong>Start from a theme</strong>
            <span>Use a Candela theme as your starting point.</span>
            <select value={seed} onChange={(event) => setSeed(event.target.value)} aria-label="Theme to start from">
              {themes.map((theme) => <option key={theme.id} value={theme.id}>{theme.name}</option>)}
            </select>
            <button type="button" onClick={() => reseed(seed)}>Start with theme</button>
          </div>
          <button className="studio-start-card" type="button" onClick={startSimple}>
            <strong>Simple editor</strong>
            <span>Build a palette from the background, accents, and status colors.</span>
          </button>
          <label className="studio-start-card studio-upload-card">
            <strong>Open a saved draft (.json)</strong>
            <span>Continue editing a Candela theme saved as JSON.</span>
            <input
              className="studio-upload-input"
              type="file"
              accept="application/json,.json"
              onChange={(event) => { void importRaw(event.target.files?.[0]); event.currentTarget.value = ''; }}
            />
          </label>
        </div>
        {importError && <p className="studio-import-error" role="alert">{importError}</p>}
      </div></div> : <>
      <div className="editor-workspace">
      <aside className="zone pg-editor">
        <div className="studio-modes studio-rail-modes" role="group" aria-label="Editing mode">
          <button type="button" className={mode === 'simple' ? 'is-on' : ''} aria-pressed={mode === 'simple'} onClick={() => switchMode('simple')}>Simple</button>
          <button type="button" className={mode === 'pro' ? 'is-on' : ''} aria-pressed={mode === 'pro'} onClick={() => switchMode('pro')}>Pro</button>
        </div>
        {mode === 'pro' ? <>
        {TOKEN_GROUPS.map((group) => (
          <fieldset key={group.label} className="pg-group">
            <legend>{group.label}</legend>
            {group.tokens.map((token) => (
              <TokenEditor
                key={token}
                token={token}
                value={draft.colors[token] ?? ''}
                gradient={passZones[token] ?? null}
                open={openToken === token}
                highlighted={highlightedToken === token}
                onToggle={() => setOpenToken(openToken === token ? null : token)}
                setColor={setColor}
                setHighlightedToken={setHighlightedToken}
              />
            ))}
          </fieldset>
        ))}
        </> : <>
          <fieldset className="pg-group gd-step">
            <legend>1 · Background</legend>
            <div className="gd-moods pg-segmented">{MOODS.map((mood) => (
              <label key={mood.value} className={choices.mood === mood.value ? 'gd-mood is-on' : 'gd-mood'}>
                <input type="radio" name="mood" checked={choices.mood === mood.value} onChange={() => updateChoices({ mood: mood.value })} />{mood.label}
              </label>
            ))}</div>
            <div className="gd-slider"><span>Darkness</span><GaugeSlider
              id="rail-token-bg"
              label="" min={0} max={100} value={choices.darkness}
              track={`linear-gradient(90deg, ${hslToHex({ ...MOOD_BG[choices.mood], l: 0.94 })}, ${hslToHex({ ...MOOD_BG[choices.mood], l: 0.88 })})`}
              onChange={(v) => updateChoices({ darkness: v })} ariaLabel="Background darkness"
            /></div>
          </fieldset>
          <fieldset className="pg-group gd-step">
            <legend>2 · Accents</legend>
            <HueDial
              hues={choices.accentHues}
              selected={selectedAccent}
              colors={draft.colors}
              onChange={(hue) => updateChoices({ accentHues: { ...choices.accentHues, [selectedAccent]: hue } })}
            />
            <div className="gd-tokens">{SYNTAX_TOKENS.map((token) => <button key={token} type="button" id={`rail-token-${token}`} className={`gd-token${selectedAccent === token ? ' gd-token-on' : ''}${highlightedToken === token ? ' rail-hi' : ''}`} onClick={() => setSelectedAccent(token)} onPointerEnter={() => setHighlightedToken(token)} onPointerLeave={() => setHighlightedToken(null)} onFocus={() => setHighlightedToken(token)} onBlur={() => setHighlightedToken(null)}><span className="gd-chip" style={{ background: draft.colors[token] }} />{token} · {TOKEN_LABELS[token]}</button>)}</div>
          </fieldset>
          <fieldset className="pg-group gd-step">
            <legend>3 · Diagnostics</legend>
            {DIAG_TOKENS.map((diagnostic) => <div key={diagnostic.key} className={`gd-slider gd-diag${highlightedToken === diagnostic.key ? ' rail-hi' : ''}`} onPointerEnter={() => setHighlightedToken(diagnostic.key)} onPointerLeave={() => setHighlightedToken(null)} onFocus={() => setHighlightedToken(diagnostic.key)} onBlur={() => setHighlightedToken(null)}>
              <span className="gd-chip" style={{ background: draft.colors[diagnostic.key] }} />
              <span className="gd-diag-label">{diagnostic.label}</span>
              <GaugeSlider
                id={`rail-token-${diagnostic.key}`}
                label="" min={0} max={360} unit="°" value={choices.diagnosticHues[diagnostic.key]}
                track={hueTrack(DIAG[diagnostic.key].s, DIAG[diagnostic.key].l)}
                onChange={(v) => updateChoices({ diagnosticHues: { ...choices.diagnosticHues, [diagnostic.key]: v } })}
                ariaLabel={`${diagnostic.key} hue`}
              />
            </div>)}
          </fieldset>
        </>}

        <fieldset className="pg-group studio-helpers">
          <legend>Palette helpers</legend>
          {(['contrast', 'saturation', 'warmth', 'darkness'] as PaletteHelper[]).map((helper) => <div key={helper} className="gd-slider">
            <span>{helper[0].toUpperCase() + helper.slice(1)}</span>
            <GaugeSlider label="" min={-50} max={50} value={helperValues[helper]} onChange={(v) => setHelperValue(helper, v)} ariaLabel={`${helper} adjustment`} />
          </div>)}
        </fieldset>

      </aside>

      <div className="zone pg-canvas" style={{ ...themeVars(draft), background: 'var(--bg)' }}>
        <VisionFilterDefinitions />
        <div
          className="pg-preview-surface"
          onClick={inspectFromPreview}
          onPointerOver={highlightFromPreview}
          onPointerLeave={clearPreviewHighlight}
        >
          <ThemeCard theme={draft} panes={panes} previewFilter={visionMode === 'normal' ? undefined : `url(#vision-${visionMode})`} highlightToken={highlightedToken ?? undefined} />
        </div>
      </div>
      <aside className="zone pg-inspector">
        <div className="pg-preview-controls">
          <PanePicker panes={panes} onChange={setPanes} />
          <fieldset className="vision-control">
            <legend>Vision</legend>
            <div className="pg-segmented">
              {VISION_MODES.map((simulation) => <button key={simulation.value} type="button" className={visionMode === simulation.value ? 'is-on' : ''} aria-pressed={visionMode === simulation.value} onClick={() => setVisionMode(simulation.value)}>{simulation.label}</button>)}
            </div>
          </fieldset>
        </div>
        <details id="editor-validation" className={justPassed ? 'pg-validation is-celebrating' : 'pg-validation'} open={validationOpenOverride ?? failures.length > 0}>
          <summary onClick={(event) => {
            event.preventDefault();
            setValidationOpenOverride(!(validationOpenOverride ?? failures.length > 0));
          }}>
            <span className="pg-validation-title">Validation</span>
            {failures.length > 0
              ? <span className="pg-validation-status is-fail">✕ {failures.length} {failures.length === 1 ? 'error' : 'errors'}{warnings.length > 0 ? ` · ${warnings.length} ${warnings.length === 1 ? 'warning' : 'warnings'}` : ''}</span>
              : warnings.length > 0 && <span className="pg-validation-status is-pass">✓ {warnings.length} {warnings.length === 1 ? 'warning' : 'warnings'}</span>}
          </summary>
          <div className="pg-validation-body">
            {failures.length === 0 ? (
              <p className="pg-ok">All contrast rules pass — ready to export.</p>
            ) : (
              <div className="pg-fails">
                <div className="pg-fails-head">
                  <strong>{failures.length} hard rule(s) failing:</strong>
                  <button
                    className="pg-fix"
                    onClick={() => { updateDraftAndResetHelpers((current) => autoFix(current)); setCopied(false); }}
                    title="Adjusts each failing color's lightness (keeping hue) to the nearest passing value"
                  >
                    Auto-fix colors
                  </button>
                </div>
                <ul>{failures.map((failure, index) => <RuleRow key={index} message={failure} onJump={jumpToToken} />)}</ul>
              </div>
            )}
            {warnings.length > 0 && (
              <div className="pg-warns">
                <strong>Warnings (allowed at export):</strong>
                <ul>{warnings.map((warning, index) => <RuleRow key={index} message={warning} onJump={jumpToToken} onVisionMode={setVisionMode} />)}</ul>
              </div>
            )}
            {contrast.length > 0 && (
              <section className="pg-contrast">
                <h3>Required contrast checks</h3>
                <table>
                  <thead><tr><th>token</th><th>against</th><th>ratio</th><th>required</th><th>status</th></tr></thead>
                  <tbody>
                    {contrast.map((tokenContrast) => (
                      <tr key={`${tokenContrast.token}-${tokenContrast.background}`}>
                        <td><button type="button" className="pg-rule-jump pg-contrast-jump" onClick={() => jumpToToken(tokenContrast.token)}>{tokenContrast.token}</button></td>
                        <td>{tokenContrast.background}</td>
                        <td>{tokenContrast.ratio.toFixed(2)}:1</td>
                        <td>{tokenContrast.floor}:1</td>
                        <td aria-label={tokenContrast.ratio >= tokenContrast.floor ? 'Pass' : 'Fail'}>{tokenContrast.ratio >= tokenContrast.floor ? '✓' : '✕'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </div>
        </details>
        <details className="pg-meta">
          <summary>Details</summary>
          <div className="pg-meta-body">
            <label className="pg-field">Name
              <input
                maxLength={60}
                value={mode === 'pro' ? draft.name : choices.name}
                onChange={(event) => mode === 'pro' ? setField('name', event.target.value) : updateChoiceMetadata({ name: event.target.value })}
              />
            </label>
            <div className="pg-field">
              <span>ID</span>
              <output className="pg-theme-id">{id}</output>
            </div>
            <label className="pg-field">Tone
              <input value={mode === 'pro' ? draft.tone : choices.tone} onChange={(e) => mode === 'pro' ? setField('tone', e.target.value) : updateChoiceMetadata({ tone: e.target.value })} />
            </label>
            <label className="pg-field">Description
              <textarea rows={2} value={mode === 'pro' ? draft.description : choices.description} onChange={(e) => mode === 'pro' ? setField('description', e.target.value) : updateChoiceMetadata({ description: e.target.value })} />
            </label>
            <label className="pg-field">Code font
              <select value={mode === 'pro' ? draft.fonts.code : choices.fonts.code} onChange={(e) => mode === 'pro' ? setFont('code', e.target.value) : updateChoiceMetadata({ fonts: { ...choices.fonts, code: e.target.value } })}>
                {CODE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
            <label className="pg-field">Prose font
              <select value={mode === 'pro' ? draft.fonts.prose : choices.fonts.prose} onChange={(e) => mode === 'pro' ? setFont('prose', e.target.value) : updateChoiceMetadata({ fonts: { ...choices.fonts, prose: e.target.value } })}>
                {PROSE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </label>
          </div>
        </details>
      </aside>
      </div>
      </>}
      {exportDialogOpen && <Dialog title="Save & Export" onCancel={() => setExportDialogOpen(false)}>
        <ExportControls
          theme={draft}
          canExport={canExport}
          onCopyShareLink={copyShareLink}
          shareLinkCopied={shareLinkCopied}
          draftJsonButton={<button type="button" onClick={downloadRaw}>Save draft JSON</button>}
          copyJsonButton={<button type="button" onClick={copy} disabled={!canExport}>{copied ? 'Copied!' : 'Copy theme JSON'}</button>}
        />
        <details className="pg-json">
          <summary>Theme JSON</summary>
          <pre>{json}</pre>
        </details>
      </Dialog>}
      {replacement && <Dialog
        title="Open theme?"
        message={`Open ${replacement.draft.name}? This replaces your draft '${draft.name}'.`}
        confirmLabel="Open"
        cancelLabel="Keep my draft"
        onConfirm={openReplacement}
        onCancel={() => setReplacement(null)}
      />}
      {startOverDialogOpen && <Dialog
        title="Start over?"
        message="This clears your saved draft and all current edits."
        confirmLabel="Start over"
        onConfirm={confirmStartOver}
        onCancel={() => setStartOverDialogOpen(false)}
      />}
    </section>
  );
}
