// Zed emitter. Zed consumes a single theme-family JSON: one file, all themes as
// entries with appearance from each theme's mode and a style{} block. The
// integrated terminal ANSI keys reuse the shared ansiMapping so terminal and
// editor stay in sync, exactly like VS Code.

import { SUMMARY } from '../copy.js';
import { ANSI_ORDER, alpha, n, resolveAnsi, file, DEFAULT_VERSION, REPO_URL } from './shared.js';

// Zed syntax highlight name -> Candela token, following the README scope roles.
const ZED_SYNTAX = [
  ['keyword', 'kw'],
  ['string', 'str'],
  ['string.special', 'str'],
  ['string.escape', 'str'],
  ['function', 'fn'],
  ['function.method', 'fn'],
  ['number', 'num'],
  ['boolean', 'num'],
  ['constant', 'num'],
  ['type', 'type'],
  ['constructor', 'type'],
  ['variable.special', 'builtin'],
  ['attribute', 'builtin'],
  ['operator', 'punct'],
  ['punctuation', 'punct'],
  ['punctuation.bracket', 'punct'],
  ['punctuation.delimiter', 'punct'],
  ['comment', 'faint', { font_style: 'italic' }],
  ['comment.doc', 'faint', { font_style: 'italic' }],
  // Zed scopes JSON/object keys as `property` and markup tags as `tag`; unmapped,
  // every JSON key and HTML tag falls back to plain text.
  ['property', 'builtin'],
  ['tag', 'type'],
  ['string.regex', 'str'],
  // Markdown and other prose grammars (see TOKEN_SCOPES): unmapped means flat text.
  ['title', 'fn', { font_weight: 700 }],
  ['emphasis', 'kw', { font_style: 'italic' }],
  ['emphasis.strong', 'kw', { font_weight: 700 }],
  ['link_text', 'fn'],
  ['link_uri', 'fn'],
  ['text.literal', 'builtin'],
];

// Status roles (diagnostics, git decorations, diff gutters). Each has a
// foreground plus a faint wash and border Zed paints behind diffs and
// inline diagnostics.
const ZED_STATUS = [
  ['error', 'error'],
  ['deleted', 'error'],
  ['conflict', 'warning'],
  ['modified', 'warning'],
  ['warning', 'warning'],
  ['success', 'ok'],
  ['created', 'ok'],
  ['renamed', 'builtin'],
  ['info', 'builtin'],
  ['hint', 'faint'],
  ['predictive', 'faint'],
  ['ignored', 'faint'],
  ['hidden', 'faint'],
  ['unreachable', 'faint'],
];

const TRANSPARENT = '#00000000';

function zedStyle(theme, ansiMapping) {
  const c = theme.colors;
  // Zed has no theme inheritance: any key a theme omits keeps the built-in
  // default theme's value, so a partial theme recolors the editor and leaves
  // gray chrome plus default-yellow git decorations. Every chrome key gets set.
  const style = {
    background: n(c.bg),
    'surface.background': n(c.surface),
    'elevated_surface.background': n(c.surface),
    'panel.background': n(c.bg),
    'panel.focused_border': n(c.builtin),
    'panel.indent_guide': n(c.border),
    'panel.indent_guide_active': n(c.ink2),
    'panel.indent_guide_hover': n(c.ink2),
    'title_bar.background': n(c.bg),
    'title_bar.inactive_background': n(c.bg),
    'status_bar.background': n(c.bg),
    'toolbar.background': n(c.surface),
    'tab_bar.background': n(c.bg),
    'tab.inactive_background': n(c.bg),
    'tab.active_background': n(c.surface),
    'pane.focused_border': n(c.builtin),
    'pane_group.border': n(c.border),
    border: n(c.border),
    'border.variant': n(c.border),
    'border.focused': n(c.builtin),
    'border.selected': n(c.builtin),
    'border.disabled': n(c.border),
    'border.transparent': TRANSPARENT,
    'element.background': n(c.surface),
    'element.hover': n(c.lineHighlight),
    'element.active': n(c.selection),
    'element.selected': n(c.selection),
    'element.disabled': n(c.border),
    'ghost_element.background': TRANSPARENT,
    'ghost_element.hover': n(c.lineHighlight),
    'ghost_element.active': n(c.selection),
    'ghost_element.selected': n(c.selection),
    'ghost_element.disabled': TRANSPARENT,
    'drop_target.background': alpha(c.builtin, '33'),
    text: n(c.ink),
    'text.muted': n(c.ink2),
    'text.placeholder': n(c.faint),
    'text.disabled': n(c.faint),
    'text.accent': n(c.builtin),
    icon: n(c.ink),
    'icon.muted': n(c.ink2),
    'icon.placeholder': n(c.faint),
    'icon.disabled': n(c.faint),
    'icon.accent': n(c.builtin),
    'link_text.hover': n(c.fn),
    'scrollbar.thumb.background': alpha(c.faint, '55'),
    'scrollbar.thumb.hover_background': alpha(c.faint, '88'),
    'scrollbar.thumb.border': TRANSPARENT,
    'scrollbar.track.background': TRANSPARENT,
    'scrollbar.track.border': n(c.border),
    'search.match_background': alpha(c.selection, 'cc'),
    'editor.foreground': n(c.ink),
    'editor.background': n(c.surface),
    'editor.gutter.background': n(c.surface),
    'editor.subheader.background': n(c.bg),
    'editor.line_number': n(c.ink2),
    'editor.active_line_number': n(c.ink),
    'editor.active_line.background': n(c.lineHighlight),
    'editor.highlighted_line.background': n(c.lineHighlight),
    'editor.invisible': n(c.faint),
    'editor.wrap_guide': n(c.border),
    'editor.active_wrap_guide': n(c.ink2),
    'editor.indent_guide': n(c.border),
    'editor.indent_guide_active': n(c.ink2),
    'editor.document_highlight.read_background': n(c.selection),
    'editor.document_highlight.write_background': n(c.selection),
    'editor.document_highlight.bracket_background': n(c.selection),
    'terminal.background': n(c.surface),
    'terminal.foreground': n(c.ink),
    'terminal.bright_foreground': n(c.ink),
    'terminal.dim_foreground': n(c.ink2),
    players: [{ cursor: n(c.cursor), selection: n(c.selection), background: n(c.cursor) }],
  };

  for (const [role, token] of ZED_STATUS) {
    style[role] = n(c[token]);
    style[role + '.background'] = alpha(c[token], '22');
    style[role + '.border'] = alpha(c[token], '55');
  }

  const ansi = resolveAnsi(ansiMapping, c);
  style['terminal.ansi.background'] = n(c.surface);
  ANSI_ORDER.forEach((name, i) => {
    style['terminal.ansi.' + name] = ansi[i];
    style['terminal.ansi.bright_' + name] = ansi[i + 8];
    // Zed has no dim derivation: unset dim slots fall back to the default
    // theme's palette, so they get the normal slot faded over the background.
    style['terminal.ansi.dim_' + name] = alpha(ansi[i], 'aa');
  });

  const syntax = {};
  for (const [name, token, attrs] of ZED_SYNTAX) {
    syntax[name] = { color: n(c[token]), ...attrs };
  }
  style.syntax = syntax;
  return style;
}

export function zedFamily(themes, ansiMapping) {
  return {
    $schema: 'https://zed.dev/schema/themes/v0.2.0.json',
    name: 'Candela',
    author: 'Candela',
    themes: themes.map((theme) => ({
      name: `Candela ${theme.name}`,
      appearance: theme.mode,
      style: zedStyle(theme, ansiMapping),
    })),
  };
}

export function zedExtensionToml(id, name, version) {
  return [
    `id = "${id}"`,
    `name = "${name}"`,
    `version = "${version}"`,
    'schema_version = 1',
    'authors = ["Candela"]',
    // Zed shows this in a one-line extension list, so it gets the short variant.
    `description = ${JSON.stringify(SUMMARY)}`,
    `repository = "${REPO_URL}"`,
    '',
  ].join('\n');
}

// Single-theme Zed export mirrors the released extension layout (extension.toml
// + themes/), so the download installs as a real dev extension rather than a
// loose file the user has to place by hand.
export function emitZedTheme(theme, ansiMapping) {
  return {
    files: [
      file('extension.toml', zedExtensionToml(`candela-${theme.id}`, `Candela ${theme.name}`, DEFAULT_VERSION)),
      file('themes/candela.json', JSON.stringify(zedFamily([theme], ansiMapping), null, 2) + '\n'),
    ],
  };
}
