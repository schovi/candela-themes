// VS Code extension emitter. Unlike the terminal formats (one flat file per
// theme), VS Code needs a whole extension folder: one package.json contributing
// all themes plus one color-theme JSON each. Each contribution follows the
// theme's mode.

import { normalizeHex } from '../colors.js';
import { DESCRIPTION } from '../copy.js';
import { ANSI_ORDER, alpha, cap, n, resolveAnsi, file, DEFAULT_VERSION, REPO_URL, HOMEPAGE_URL } from './shared.js';
import { TOKEN_SCOPES } from './scopes.js';

// Ships only what the extension needs; keeps `vsce package` from bundling cruft.
export const VSCODE_IGNORE = ['.vscode/**', '**/*.map', '.gitignore', 'vsc-extension-quickstart.md', ''].join('\n');

// Full workbench + syntax color set for one theme. UI mapping follows task 002:
// editor from surface/ink, chrome from bg/surface, borders from border, and the
// integrated terminal reuses the shared ansiMapping so it matches the terminal
// themes exactly.
function resolveEditor(theme, ansiMapping) {
  const c = theme.colors;

  const colors = {
    foreground: n(c.ink),
    'icon.foreground': n(c.ink2),
    focusBorder: n(c.border),
    'selection.background': n(c.selection),
    descriptionForeground: n(c.ink2),
    errorForeground: n(c.error),
    'widget.border': n(c.border),

    // Editor pane
    'editor.background': n(c.surface),
    'editor.foreground': n(c.ink),
    'editorLineNumber.foreground': n(c.ink2),
    'editorLineNumber.activeForeground': n(c.ink),
    'editorCursor.foreground': n(c.cursor),
    'editor.selectionBackground': n(c.selection),
    'editor.selectionHighlightBackground': alpha(c.selection, '80'),
    'editor.lineHighlightBackground': n(c.lineHighlight),
    'editor.lineHighlightBorder': n(c.lineHighlight),
    'editorIndentGuide.background1': n(c.border),
    'editorIndentGuide.activeBackground1': n(c.faint),
    'editorWhitespace.foreground': n(c.faint),
    'editorRuler.foreground': n(c.border),
    'editorError.foreground': n(c.error),
    'editorWarning.foreground': n(c.warning),
    'editorGutter.addedBackground': n(c.ok),
    'editorGutter.deletedBackground': n(c.error),
    'editorGutter.modifiedBackground': n(c.fn),
    'editorBracketMatch.background': alpha(c.selection, '80'),
    'editorBracketMatch.border': n(c.faint),
    // Bracket pair colorization is ON by default, and an unset theme gets VS Code's
    // built-in gold/violet/blue rainbow — neon accents painted straight over a
    // deliberately desaturated palette. All six levels take `punct`, which keeps
    // brackets reading as punctuation; only an unmatched bracket breaks color.
    'editorBracketHighlight.foreground1': n(c.punct),
    'editorBracketHighlight.foreground2': n(c.punct),
    'editorBracketHighlight.foreground3': n(c.punct),
    'editorBracketHighlight.foreground4': n(c.punct),
    'editorBracketHighlight.foreground5': n(c.punct),
    'editorBracketHighlight.foreground6': n(c.punct),
    'editorBracketHighlight.unexpectedBracket.foreground': n(c.error),
    'editorInfo.foreground': n(c.fn),
    'editorInlayHint.foreground': n(c.ink2),
    'editorInlayHint.background': alpha(c.border, '66'),
    'editorCodeLens.foreground': n(c.faint),
    'editorLightBulb.foreground': n(c.warning),
    'editorLink.activeForeground': n(c.fn),
    'editorOverviewRuler.border': n(c.border),
    'minimap.background': n(c.surface),

    // Editor widgets (find, suggest, hover)
    'editorWidget.background': n(c.bg),
    'editorWidget.border': n(c.border),
    'editorSuggestWidget.background': n(c.bg),
    'editorSuggestWidget.border': n(c.border),
    'editorSuggestWidget.selectedBackground': n(c.selection),
    'editorHoverWidget.background': n(c.bg),
    'editorHoverWidget.border': n(c.border),

    // Diffs
    'diffEditor.insertedTextBackground': alpha(c.ok, '22'),
    'diffEditor.removedTextBackground': alpha(c.error, '22'),

    // Activity bar
    'activityBar.background': n(c.bg),
    'activityBar.foreground': n(c.ink),
    'activityBar.inactiveForeground': n(c.faint),
    'activityBar.border': n(c.border),
    'activityBarBadge.background': n(c.fn),
    'activityBarBadge.foreground': n(c.surface),

    // Side bar
    'sideBar.background': n(c.bg),
    'sideBar.foreground': n(c.ink2),
    'sideBar.border': n(c.border),
    'sideBarTitle.foreground': n(c.ink),
    'sideBarSectionHeader.background': n(c.bg),
    'sideBarSectionHeader.foreground': n(c.ink),
    'sideBarSectionHeader.border': n(c.border),
    'agents.background': n(c.bg),
    'agentsPanel.background': n(c.surface),
    'agentsPanel.foreground': n(c.ink),
    'agentsPanel.border': n(c.border),

    // Lists (explorer, suggestions)
    'list.activeSelectionBackground': n(c.selection),
    'list.activeSelectionForeground': n(c.ink),
    'list.inactiveSelectionBackground': n(c.lineHighlight),
    'list.hoverBackground': n(c.lineHighlight),
    'list.highlightForeground': n(c.fn),

    // Editor groups & tabs
    'editorGroup.border': n(c.border),
    'editorGroupHeader.tabsBackground': n(c.bg),
    'editorGroupHeader.tabsBorder': n(c.border),
    'tab.activeBackground': n(c.surface),
    'tab.activeForeground': n(c.ink),
    'tab.inactiveBackground': n(c.bg),
    'tab.inactiveForeground': n(c.ink2),
    'tab.border': n(c.border),
    'tab.activeBorder': n(c.fn),

    // Status bar
    'statusBar.background': n(c.surface),
    'statusBar.foreground': n(c.ink2),
    'statusBar.border': n(c.border),
    'statusBar.noFolderBackground': n(c.surface),
    'statusBar.debuggingBackground': n(c.warning),
    'statusBar.debuggingForeground': n(c.surface),

    // Title bar
    'titleBar.activeBackground': n(c.bg),
    'titleBar.activeForeground': n(c.ink),
    'titleBar.inactiveBackground': n(c.bg),
    'titleBar.inactiveForeground': n(c.faint),
    'titleBar.border': n(c.border),

    // Panel (terminal, problems, output)
    'panel.background': n(c.surface),
    'panel.border': n(c.border),
    'panelTitle.activeForeground': n(c.ink),
    'panelTitle.inactiveForeground': n(c.faint),
    'panelTitle.activeBorder': n(c.fn),

    // Integrated terminal
    'terminal.background': n(c.surface),
    'terminal.foreground': n(c.ink),
    'terminalCursor.foreground': n(c.cursor),
    'terminal.selectionBackground': n(c.selection),

    // Inputs, dropdowns, buttons, badges
    'input.background': n(c.surface),
    'input.foreground': n(c.ink),
    'input.border': n(c.border),
    'input.placeholderForeground': n(c.faint),
    'dropdown.background': n(c.surface),
    'dropdown.foreground': n(c.ink),
    'dropdown.border': n(c.border),
    'button.background': n(c.fn),
    'button.foreground': n(c.surface),
    'badge.background': n(c.fn),
    'badge.foreground': n(c.surface),

    // Scrollbar (translucent so it never hides content)
    'scrollbarSlider.background': alpha(c.faint, '55'),
    'scrollbarSlider.hoverBackground': alpha(c.faint, '88'),
    'scrollbarSlider.activeBackground': alpha(c.ink2, '88'),

    // Git decorations
    'gitDecoration.modifiedResourceForeground': n(c.warning),
    'gitDecoration.deletedResourceForeground': n(c.error),
    'gitDecoration.untrackedResourceForeground': n(c.ok),
    'gitDecoration.ignoredResourceForeground': n(c.faint),

    // Surfaces that otherwise keep VS Code's own grays inside a Candela window.
    'breadcrumb.background': n(c.surface),
    'breadcrumb.foreground': n(c.ink2),
    'breadcrumb.focusForeground': n(c.ink),
    'breadcrumbPicker.background': n(c.bg),
    'peekView.border': n(c.border),
    'peekViewEditor.background': n(c.surface),
    'peekViewResult.background': n(c.bg),
    'peekViewTitle.background': n(c.bg),
    'notebook.editorBackground': n(c.surface),
    'notebook.cellEditorBackground': n(c.surface),
    'textLink.foreground': n(c.fn),
    'textLink.activeForeground': n(c.fn),
    'textCodeBlock.background': n(c.bg),
  };

  const ansi = resolveAnsi(ansiMapping, c);
  ANSI_ORDER.forEach((name, i) => {
    colors['terminal.ansi' + cap(name)] = ansi[i];
    colors['terminal.ansiBright' + cap(name)] = ansi[i + 8];
  });

  const tokenColors = TOKEN_SCOPES.map(({ token, scopes, fontStyle }) => ({
    scope: scopes,
    settings: fontStyle
      ? { foreground: normalizeHex(c[token]), fontStyle }
      : { foreground: normalizeHex(c[token]) },
  }));

  return { colors, tokenColors };
}

export function vscodeThemeDocument(theme, ansiMapping) {
  const { colors, tokenColors } = resolveEditor(theme, ansiMapping);
  return {
    name: `Candela ${theme.name}`,
    type: theme.mode,
    // Opt in explicitly: VS Code only runs the semantic-token layer for themes that
    // declare it, so without this TS/Rust/Python get TextMate scopes alone.
    semanticHighlighting: true,
    colors,
    tokenColors,
  };
}

export const vscodeThemePath = (theme) => `candela-${theme.id}-color-theme.json`;

export function vscodePackage(themes, version = DEFAULT_VERSION) {
  return {
    name: 'candela-themes',
    displayName: 'Candela Themes',
    description: DESCRIPTION,
    version,
    publisher: 'candela',
    engines: { vscode: '^1.70.0' },
    categories: ['Themes'],
    keywords: ['theme', 'light', 'dark', 'color-theme', 'eye-strain', 'accessibility'],
    galleryBanner: { color: '#f4ece0', theme: 'light' },
    repository: { type: 'git', url: `${REPO_URL}.git` },
    bugs: { url: `${REPO_URL}/issues` },
    homepage: HOMEPAGE_URL,
    license: 'MIT',
    contributes: {
      themes: themes.map((theme) => ({
        label: `Candela ${theme.name}`,
        uiTheme: theme.mode === 'dark' ? 'vs-dark' : 'vs',
        path: `./themes/${vscodeThemePath(theme)}`,
      })),
    },
  };
}

// Single-theme export: a minimal extension folder the app hands to the browser.
export function emitVscodeTheme(theme, ansiMapping) {
  return {
    files: [
      file(`themes/${vscodeThemePath(theme)}`, JSON.stringify(vscodeThemeDocument(theme, ansiMapping), null, 2) + '\n'),
      file('package.json', JSON.stringify(vscodePackage([theme]), null, 2) + '\n'),
      file('.vscodeignore', VSCODE_IGNORE),
    ],
  };
}
