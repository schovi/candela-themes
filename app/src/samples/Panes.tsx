import type { ReactNode } from 'react';
import type { ColorToken } from '../themes';

export type PaneKey =
  | 'terminal'
  | 'typescript'
  | 'markdown'
  | 'git'
  | 'ruby'
  | 'kotlin'
  | 'python'
  | 'rust'
  | 'go'
  | 'diagnostics';

// Default 4 come first; the rest are opt-in via the gallery's pane toggles.
export const PANE_ORDER: { key: PaneKey; label: string }[] = [
  { key: 'terminal', label: 'Terminal' },
  { key: 'typescript', label: 'TypeScript' },
  { key: 'markdown', label: 'Markdown' },
  { key: 'git', label: 'Git' },
  { key: 'ruby', label: 'Ruby' },
  { key: 'kotlin', label: 'Kotlin' },
  { key: 'python', label: 'Python' },
  { key: 'rust', label: 'Rust' },
  { key: 'go', label: 'Go' },
  { key: 'diagnostics', label: 'Diagnostics' },
];

// Shown by default in the gallery and captured by the screenshot command.
export const DEFAULT_PANES: PaneKey[] = ['terminal', 'typescript', 'markdown', 'git'];

// Token-colored span. Every sample reads its colors from the theme's CSS
// variables (set on the card root), exactly like the original .dc.html showcase.
function C({ t, children }: { t: ColorToken; children: ReactNode }) {
  return <span style={{ color: `var(--${t})` }}>{children}</span>;
}

const preStyle: React.CSSProperties = {
  margin: 0,
  padding: '18px 20px',
  font: '14.5px/1.75 var(--code-font), monospace',
  color: 'var(--ink)',
  whiteSpace: 'pre',
  overflow: 'auto',
  tabSize: 2,
};

function Pane({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="pane">
      <div className="pane-bar">
        <span className="dot" />
        <span className="dot" />
        <span className="dot" />
        <span className="pane-title">{title}</span>
      </div>
      {children}
    </div>
  );
}

function Terminal() {
  return (
    <Pane title="zsh — aurora">
      <pre style={preStyle}>
        <div><C t="fn">~/projects/aurora</C> <C t="ink2">on</C> <C t="kw">main</C></div>
        <div><C t="str">❯</C> git status</div>
        <div><C t="ink2">On branch </C><C t="kw">main</C><C t="ink2">, up to date.</C></div>
        <div><C t="ink2">Changes not staged for commit:</C></div>
        <div>{'  '}<C t="num">modified:</C>{'   '}src/theme.rb</div>
        <div><C t="str">❯</C> bundle exec rspec</div>
        <div><C t="str">........</C> <C t="ink2">(42 examples, </C><C t="str">0 failures</C><C t="ink2">)</C></div>
        <div><C t="str">❯</C> <span style={{ opacity: 0.55 }}>▋</span></div>
      </pre>
    </Pane>
  );
}

function Ruby() {
  return (
    <Pane title="subscription.rb">
      <pre style={preStyle}>
        <div><C t="faint"># app/models/subscription.rb</C></div>
        <div><C t="kw">class</C> <C t="type">Subscription</C> <C t="punct">&lt;</C> <C t="type">ApplicationRecord</C></div>
        <div>{'  '}<C t="fn">belongs_to</C> <C t="builtin">:account</C></div>
        <div>{'  '}<C t="fn">scope</C> <C t="builtin">:active</C><C t="punct">,</C> <C t="kw">-&gt;</C> <C t="punct">{'{'}</C> <C t="fn">where</C><C t="punct">(</C>status<C t="punct">:</C> <C t="str">"active"</C><C t="punct">)</C> <C t="punct">{'}'}</C></div>
        <div>{'​'}</div>
        <div>{'  '}<C t="kw">def</C> <C t="fn">renew!</C><C t="punct">(</C>months <C t="punct">=</C> <C t="num">1</C><C t="punct">)</C></div>
        <div>{'    '}<C t="kw">self</C><C t="punct">.</C>expires_at <C t="punct">+=</C> months<C t="punct">.</C><C t="fn">months</C></div>
        <div>{'    '}<C t="fn">save!</C></div>
        <div>{'  '}<C t="kw">end</C></div>
        <div><C t="kw">end</C></div>
      </pre>
    </Pane>
  );
}

function Kotlin() {
  return (
    <Pane title="Billing.kt">
      <pre style={preStyle}>
        <div><C t="faint">// Billing.kt</C></div>
        <div><C t="kw">data class</C> <C t="type">Invoice</C><C t="punct">(</C><C t="kw">val</C> id<C t="punct">:</C> <C t="type">String</C><C t="punct">,</C> <C t="kw">val</C> cents<C t="punct">:</C> <C t="type">Int</C><C t="punct">)</C></div>
        <div>{'​'}</div>
        <div><C t="kw">fun</C> <C t="fn">totalDue</C><C t="punct">(</C>invoices<C t="punct">:</C> <C t="type">List</C><C t="punct">&lt;</C><C t="type">Invoice</C><C t="punct">&gt;)</C><C t="punct">:</C> <C t="type">Double</C> <C t="punct">{'{'}</C></div>
        <div>{'    '}<C t="kw">return</C> invoices</div>
        <div>{'        '}<C t="punct">.</C><C t="fn">filter</C> <C t="punct">{'{'}</C> <C t="builtin">it</C><C t="punct">.</C>cents <C t="punct">&gt;</C> <C t="num">0</C> <C t="punct">{'}'}</C></div>
        <div>{'        '}<C t="punct">.</C><C t="fn">sumOf</C> <C t="punct">{'{'}</C> <C t="builtin">it</C><C t="punct">.</C>cents <C t="punct">{'}'}</C> <C t="punct">/</C> <C t="num">100.0</C></div>
        <div><C t="punct">{'}'}</C></div>
      </pre>
    </Pane>
  );
}

function Markdown() {
  return (
    <Pane title="README.md — preview">
      <div
        style={{
          padding: '20px 22px',
          font: '15px/1.6 var(--prose-font), system-ui, sans-serif',
          color: 'var(--ink2)',
        }}
      >
        <h1 style={{ margin: '0 0 12px', font: '600 25px/1.2 var(--prose-font), system-ui, sans-serif', color: 'var(--ink)', letterSpacing: '-0.01em' }}>
          Aurora Light
        </h1>
        <p style={{ margin: '0 0 14px' }}>
          A <strong style={{ color: 'var(--ink)', fontWeight: 700 }}>low-glare</strong> light theme for tired, prescription-wearing eyes.
        </p>
        <ul style={{ margin: '0 0 14px', paddingLeft: 20 }}>
          <li style={{ marginBottom: 4 }}>Soft, off-white paper background</li>
          <li>Desaturated <a href="#" style={{ color: 'var(--fn)', textDecoration: 'underline', textUnderlineOffset: 2 }}>pastel syntax</a></li>
        </ul>
        <blockquote style={{ margin: '0 0 14px', padding: '6px 14px', borderLeft: '3px solid var(--fn)', color: 'var(--ink2)', fontStyle: 'italic' }}>
          Body contrast tuned to ~9:1 — comfortably AAA.
        </blockquote>
        <p style={{ margin: 0 }}>
          <code style={{ font: '13px var(--code-font), monospace', background: 'var(--bg)', color: 'var(--builtin)', padding: '2px 7px', borderRadius: 5, border: '1px solid var(--border)' }}>
            brew install aurora
          </code>
        </p>
      </div>
    </Pane>
  );
}

// New pane — error/warning/ok were never
// visually previewed. This closes that gap: editor squiggles + a diff hunk.
function squiggle(t: ColorToken): React.CSSProperties {
  return { textDecoration: 'underline wavy', textDecorationColor: `var(--${t})`, textDecorationThickness: 1 };
}

function Diagnostics() {
  return (
    <Pane title="Problems — diagnostics">
      <pre style={preStyle}>
        <div><C t="faint"># squiggles</C></div>
        <div><C t="kw">def</C> <C t="fn">totalDue</C><C t="punct">(</C><span style={squiggle('warning')}>invoices</span><C t="punct">)</C>   <C t="warning"># warning: unused</C></div>
        <div>{'  '}<span style={squiggle('error')}>totl</span> <C t="punct">=</C> <C t="num">0</C>   <C t="error"># error: undefined name</C></div>
        <div>{'  '}<C t="fn">puts</C> <C t="str">"ok"</C>   <C t="ok">✓ passes</C></div>
        <div>{'​'}</div>
        <div><C t="faint"># diff</C></div>
        <div style={{ background: 'var(--selection)' }}><C t="error">- total = invoices.sum { 0 }</C></div>
        <div style={{ background: 'var(--lineHighlight)' }}><C t="ok">+ total = invoices.sum {'{'} |i| i.cents {'}'}</C></div>
        <div>{'  '}<C t="ink2">total / 100.0</C></div>
      </pre>
    </Pane>
  );
}

// TypeScript with the "Problems" folded in: a real type error and an unused
// warning as inline squiggles, so error/warning tokens show on syntax in the
// default view (not only the standalone Diagnostics pane).
function TypeScript() {
  return (
    <Pane title="billing.ts — 1 error, 1 warning">
      <pre style={preStyle}>
        <div><C t="faint">// billing.ts</C></div>
        <div><C t="kw">type</C> <C t="type">Invoice</C> <C t="punct">=</C> <C t="punct">{'{'}</C> id<C t="punct">:</C> <C t="type">string</C><C t="punct">;</C> cents<C t="punct">:</C> <C t="type">number</C> <C t="punct">{'}'}</C></div>
        <div>{'​'}</div>
        <div><C t="kw">function</C> <C t="fn">totalDue</C><C t="punct">(</C>invoices<C t="punct">:</C> <C t="type">Invoice</C><C t="punct">[]):</C> <C t="type">number</C> <C t="punct">{'{'}</C></div>
        <div>{'  '}<C t="kw">return</C> invoices</div>
        <div>{'    '}<C t="punct">.</C><C t="fn">filter</C><C t="punct">((</C>i<C t="punct">)</C> <C t="kw">=&gt;</C> i<C t="punct">.</C>cents <C t="punct">&gt;</C> <C t="num">0</C><C t="punct">)</C></div>
        <div>{'    '}<C t="punct">.</C><C t="fn">reduce</C><C t="punct">((</C>sum<C t="punct">,</C> i<C t="punct">)</C> <C t="kw">=&gt;</C> sum <C t="punct">+</C> i<C t="punct">.</C><span style={squiggle('error')}>cetns</span><C t="punct">,</C> <C t="num">0</C><C t="punct">)</C>  <C t="error">// no 'cetns'</C></div>
        <div><C t="punct">{'}'}</C></div>
        <div>{'​'}</div>
        <div><C t="kw">const</C> <span style={squiggle('warning')}>unused</span> <C t="punct">=</C> <C t="fn">totalDue</C><C t="punct">([])</C>  <C t="warning">// warning: never read</C></div>
      </pre>
    </Pane>
  );
}

// Git status + diff in one pane: the "-"/"+" hunk exercises error/ok, the
// short-status flags exercise warning/num.
function Git() {
  return (
    <Pane title="git — billing.ts">
      <pre style={preStyle}>
        <div><C t="str">❯</C> git status <C t="punct">--short</C></div>
        <div><C t="warning">{' M'}</C> src/billing.ts</div>
        <div><C t="num">??</C> src/invoice.ts</div>
        <div>{'​'}</div>
        <div><C t="str">❯</C> git diff</div>
        <div><C t="builtin">@@ -4,4 +4,4 @@</C> <C t="ink2">totalDue()</C></div>
        <div style={{ background: 'var(--selection)' }}><C t="error">-    .reduce((sum, i) =&gt; sum + i.cents, 0)</C></div>
        <div style={{ background: 'var(--lineHighlight)' }}><C t="ok">+    .reduce((s, i) =&gt; s + i.cents, 0)</C></div>
        <div>{'  '}<C t="ink2">  .toFixed(2)</C></div>
      </pre>
    </Pane>
  );
}

function Python() {
  return (
    <Pane title="billing.py">
      <pre style={preStyle}>
        <div><C t="faint"># billing.py</C></div>
        <div><C t="kw">from</C> decimal <C t="kw">import</C> <C t="type">Decimal</C></div>
        <div>{'​'}</div>
        <div><C t="kw">class</C> <C t="type">Invoice</C><C t="punct">:</C></div>
        <div>{'  '}<C t="kw">def</C> <C t="fn">__init__</C><C t="punct">(</C><C t="builtin">self</C><C t="punct">,</C> id<C t="punct">:</C> <C t="type">str</C><C t="punct">,</C> cents<C t="punct">:</C> <C t="type">int</C><C t="punct">)</C> <C t="kw">-&gt;</C> <C t="type">None</C><C t="punct">:</C></div>
        <div>{'    '}<C t="builtin">self</C><C t="punct">.</C>cents <C t="punct">=</C> cents</div>
        <div>{'​'}</div>
        <div><C t="kw">def</C> <C t="fn">total_due</C><C t="punct">(</C>invoices<C t="punct">:</C> <C t="type">list</C><C t="punct">[</C><C t="type">Invoice</C><C t="punct">])</C> <C t="kw">-&gt;</C> <C t="type">Decimal</C><C t="punct">:</C></div>
        <div>{'  '}<C t="kw">return</C> <C t="fn">sum</C><C t="punct">(</C>i<C t="punct">.</C>cents <C t="kw">for</C> i <C t="kw">in</C> invoices <C t="kw">if</C> i<C t="punct">.</C>cents <C t="punct">&gt;</C> <C t="num">0</C><C t="punct">)</C> <C t="punct">/</C> <C t="num">100</C></div>
      </pre>
    </Pane>
  );
}

function Rust() {
  return (
    <Pane title="billing.rs">
      <pre style={preStyle}>
        <div><C t="faint">// billing.rs</C></div>
        <div><C t="kw">struct</C> <C t="type">Invoice</C> <C t="punct">{'{'}</C> id<C t="punct">:</C> <C t="type">String</C><C t="punct">,</C> cents<C t="punct">:</C> <C t="type">i64</C> <C t="punct">{'}'}</C></div>
        <div>{'​'}</div>
        <div><C t="kw">fn</C> <C t="fn">total_due</C><C t="punct">(</C>invoices<C t="punct">:</C> <C t="punct">&amp;[</C><C t="type">Invoice</C><C t="punct">])</C> <C t="kw">-&gt;</C> <C t="type">f64</C> <C t="punct">{'{'}</C></div>
        <div>{'  '}invoices<C t="punct">.</C><C t="fn">iter</C><C t="punct">()</C></div>
        <div>{'    '}<C t="punct">.</C><C t="fn">filter</C><C t="punct">(|</C>i<C t="punct">|</C> i<C t="punct">.</C>cents <C t="punct">&gt;</C> <C t="num">0</C><C t="punct">)</C></div>
        <div>{'    '}<C t="punct">.</C><C t="fn">map</C><C t="punct">(|</C>i<C t="punct">|</C> i<C t="punct">.</C>cents<C t="punct">)</C><C t="punct">.</C><C t="fn">sum</C><C t="punct">::&lt;</C><C t="type">i64</C><C t="punct">&gt;()</C> <C t="kw">as</C> <C t="type">f64</C> <C t="punct">/</C> <C t="num">100.0</C></div>
        <div><C t="punct">{'}'}</C></div>
      </pre>
    </Pane>
  );
}

function Go() {
  return (
    <Pane title="billing.go">
      <pre style={preStyle}>
        <div><C t="faint">// billing.go</C></div>
        <div><C t="kw">package</C> billing</div>
        <div>{'​'}</div>
        <div><C t="kw">type</C> <C t="type">Invoice</C> <C t="kw">struct</C> <C t="punct">{'{'}</C> <C t="type">ID</C> <C t="type">string</C><C t="punct">;</C> <C t="type">Cents</C> <C t="type">int64</C> <C t="punct">{'}'}</C></div>
        <div>{'​'}</div>
        <div><C t="kw">func</C> <C t="fn">TotalDue</C><C t="punct">(</C>invoices <C t="punct">[]</C><C t="type">Invoice</C><C t="punct">)</C> <C t="type">float64</C> <C t="punct">{'{'}</C></div>
        <div>{'  '}<C t="kw">var</C> sum <C t="type">int64</C></div>
        <div>{'  '}<C t="kw">for</C> <C t="punct">_,</C> i <C t="punct">:=</C> <C t="kw">range</C> invoices <C t="punct">{'{'}</C></div>
        <div>{'    '}<C t="kw">if</C> i<C t="punct">.</C><C t="type">Cents</C> <C t="punct">&gt;</C> <C t="num">0</C> <C t="punct">{'{'}</C> sum <C t="punct">+=</C> i<C t="punct">.</C><C t="type">Cents</C> <C t="punct">{'}'}</C></div>
        <div>{'  '}<C t="punct">{'}'}</C></div>
        <div>{'  '}<C t="kw">return</C> <C t="type">float64</C><C t="punct">(</C>sum<C t="punct">)</C> <C t="punct">/</C> <C t="num">100</C></div>
        <div><C t="punct">{'}'}</C></div>
      </pre>
    </Pane>
  );
}

const PANES: Record<PaneKey, () => React.JSX.Element> = {
  terminal: Terminal,
  typescript: TypeScript,
  markdown: Markdown,
  git: Git,
  ruby: Ruby,
  kotlin: Kotlin,
  python: Python,
  rust: Rust,
  go: Go,
  diagnostics: Diagnostics,
};

export function SamplePanes({ panes }: { panes: Set<PaneKey> }) {
  return (
    <div className="samples">
      {PANE_ORDER.filter((p) => panes.has(p.key)).map((p) => {
        const Comp = PANES[p.key];
        return <Comp key={p.key} />;
      })}
    </div>
  );
}
