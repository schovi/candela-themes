// Candela theme generator. Reads themes/candela-themes.json (the single source
// of truth) and emits every distributable format. Zero runtime dependencies —
// runs on a stock Node install and bundles into the browser app unchanged.
//
// Two entry points, deliberately different in shape:
//   - FORMAT_EMITTERS: one theme -> a small folder, for the app's per-theme download.
//   - emitFullFamily:  all themes -> the full build/ tree scripts/generate.js writes.
// Both call the same per-tool builders, so a single-theme download can never
// drift from what ships in the packaged extension.
//
// build/ holds the source fragments and is wiped and rewritten on each run so
// output is deterministic and diffable. Packaging (e.g. the VS Code .vsix) turns
// those fragments into distributables under dist/ — see scripts/package-vscode.js.
// Neither build/ nor dist/ is committed.

import { file, resolveTerminal, DEFAULT_VERSION } from './shared.js';
import { TERMINAL_FORMATS } from './terminals.js';
import { emitVscodeTheme, vscodeThemeDocument, vscodePackage, vscodeThemePath, VSCODE_IGNORE } from './vscode.js';
import {
  emitIntellijThemePackage,
  emitIntellijPluginXml,
  intellijGradleFiles,
  intellijThemeFiles,
} from './intellij.js';
import { emitZedTheme, zedFamily, zedExtensionToml } from './zed.js';
import { sublimeSchemeFile, SUBLIME_ADAPTIVE_PLUGIN } from './sublime.js';
import { emitNvimPackage, nvimThemeFile } from './nvim.js';
import { emitVimPackage, vimThemeFile } from './vim.js';
import { emitEmacsPackage, emacsThemeFile } from './emacs.js';
import { emitXcodePackage, xcodeThemeFile } from './xcode.js';
import { helixThemeFile } from './helix.js';
import { emitObsidianTheme, obsidianManifest, obsidianReadme, obsidianThemeCss } from './obsidian.js';
import { vscodeReadme, sublimeReadme, zedReadme, nvimReadme } from './readmes.js';

// Every format the app can export a single theme as, in menu order.
export const FORMAT_EMITTERS = [
  ...TERMINAL_FORMATS.map(({ tool, label, ext, emit }) => ({
    tool,
    label,
    emit: (theme, ansiMapping) => ({
      files: [file(`candela-${theme.id}.${ext}`, emit(resolveTerminal(theme, ansiMapping), theme))],
    }),
  })),
  { tool: 'vscode', label: 'VS Code', emit: emitVscodeTheme },
  { tool: 'intellij', label: 'IntelliJ', emit: emitIntellijThemePackage },
  { tool: 'zed', label: 'Zed', emit: emitZedTheme },
  { tool: 'sublime', label: 'Sublime Text', emit: (theme) => ({ files: [sublimeSchemeFile(theme)] }) },
  { tool: 'nvim', label: 'Neovim', emit: emitNvimPackage },
  { tool: 'vim', label: 'Vim', emit: emitVimPackage },
  { tool: 'emacs', label: 'Emacs', emit: emitEmacsPackage },
  { tool: 'xcode', label: 'Xcode', emit: emitXcodePackage },
  { tool: 'helix', label: 'Helix', emit: (theme) => ({ files: [helixThemeFile(theme)] }) },
  { tool: 'obsidian', label: 'Obsidian', emit: emitObsidianTheme },
];

const INSTALL_STEPS = {
  iterm2: 'Open Settings → Profiles → Colors, choose Color Presets… → Import…, then select the imported preset.',
  alacritty: (theme) => `Save \`${theme.id}.toml\` as \`~/.config/alacritty/themes/${theme.id}.toml\`, then add \`[general]\` followed by \`import = ["~/.config/alacritty/themes/${theme.id}.toml"]\` to \`~/.config/alacritty/alacritty.toml\`.`,
  kitty: (theme) => `Save \`${theme.id}.conf\` as \`~/.config/kitty/themes/${theme.id}.conf\`, then add \`include themes/${theme.id}.conf\` to \`~/.config/kitty/kitty.conf\` and restart Kitty.`,
  wezterm: (theme) => `Save \`${theme.id}.toml\` as \`~/.config/wezterm/colors/${theme.id}.toml\`, then set \`config.color_scheme = "${theme.id}"\` in \`~/.wezterm.lua\` and restart WezTerm.`,
  'windows-terminal': 'Open Windows Terminal settings JSON and add the exported object to the schemes array.',
  ghostty: (theme) => `Save \`${theme.id}.conf\` as \`~/.config/ghostty/themes/${theme.id}.conf\`, then add \`config-file = themes/${theme.id}.conf\` to \`~/.config/ghostty/config\` and restart Ghostty.`,
  vscode: 'Copy this folder into your VS Code extensions directory, reload VS Code, then choose the theme from Preferences: Color Theme.',
  intellij: 'Run `gradle buildPlugin` in this folder, then open Settings → Plugins → ⚙ → Install Plugin from Disk… and select the zip under `build/distributions/`. Restart the IDE and choose the theme under Settings → Appearance & Behavior → Appearance.',
  zed: 'This folder is a Zed extension. In Zed, open the command palette and run `zed: install dev extension`, select this folder, then pick the theme from the theme selector.',
  sublime: 'Copy the .sublime-color-scheme file into your Sublime Text Packages/User directory, then select it from Preferences → Select Color Scheme. A loose scheme file recolors the editor only; for the sidebar, tabs and status bar as well, set Preferences → Theme to Adaptive (the packaged version offers this for you).',
  nvim: 'Copy the Lua file into colors/ on your Neovim runtime path, then run :colorscheme with its filename (without .lua).',
  vim: 'Copy the .vim file into ~/.vim/colors/, then run :colorscheme with its filename (without .vim).',
  emacs: 'Copy the .el file into a directory on custom-theme-load-path, then run M-x load-theme and choose the Candela theme.',
  xcode: 'Copy the .xccolortheme file into ~/Library/Developer/Xcode/UserData/FontAndColorThemes/, restart Xcode, then select it in Settings → Themes.',
  helix: 'Copy the TOML file into the Helix themes directory, then set theme to its filename (without .toml) in config.toml.',
  obsidian: 'Extract this archive, copy the Candela folder into your vault’s .obsidian/themes directory, then select Candela in Settings → Appearance.',
};

export function installReadme(tool, theme) {
  const format = FORMAT_EMITTERS.find((candidate) => candidate.tool === tool);
  if (!format) throw new Error(`Unknown export format: ${tool}`);
  const instruction = INSTALL_STEPS[tool];
  const steps = typeof instruction === 'function' ? instruction(theme) : instruction;
  const title = tool === 'obsidian' ? 'Candela for Obsidian' : `${theme.name} for ${format.label}`;
  return `# ${title}\n\n${steps}\n\nGenerated by Candela Themes.\n`;
}

const json = (doc) => JSON.stringify(doc, null, 2) + '\n';

function vscodeFamilyFiles(themes, ansiMapping, licenseContent, iconContent, version) {
  const pkg = vscodePackage(themes, version);
  pkg.icon = 'icon.png';
  return [
    ...themes.map((theme) =>
      file(`vscode/themes/${vscodeThemePath(theme)}`, json(vscodeThemeDocument(theme, ansiMapping))),
    ),
    file('vscode/package.json', json(pkg)),
    file('vscode/README.md', vscodeReadme(themes)),
    file('vscode/.vscodeignore', VSCODE_IGNORE),
    file('vscode/LICENSE', licenseContent),
    file('vscode/icon.png', iconContent),
  ];
}

function intellijFamilyFiles(themes, version) {
  return [
    ...themes.flatMap((theme) => intellijThemeFiles(theme, 'intellij/')),
    file('intellij/src/main/resources/META-INF/plugin.xml', emitIntellijPluginXml(themes, version)),
    ...intellijGradleFiles('candela-themes-intellij', version).map((f) => file(`intellij/${f.path}`, f.content)),
  ];
}

function sublimeFamilyFiles(themes) {
  return [
    ...themes.map((theme) => sublimeSchemeFile(theme, 'sublime/')),
    file('sublime/README.md', sublimeReadme(themes)),
    file('sublime/candela_adaptive_ui.py', SUBLIME_ADAPTIVE_PLUGIN),
    file('sublime/Default.sublime-commands', json([
      { caption: 'Candela: Color the sidebar, tabs and status bar too', command: 'candela_use_adaptive_ui' },
    ])),
    file('sublime/messages.json', json({ install: 'messages/install.txt' })),
    file('sublime/messages/install.txt', [
      'Candela is installed. Choose a scheme from Preferences > Select Color Scheme.',
      '',
      'Candela will then offer to switch your UI theme to Adaptive, so the sidebar, tabs and',
      'status bar follow the palette too. To do it later, run "Candela: Color the sidebar, tabs',
      'and status bar too" from the command palette.',
      '',
    ].join('\n')),
  ];
}

export function emitFullFamily(themes, ansiMapping, licenseContent, iconContent, version = DEFAULT_VERSION) {
  const terminalFiles = themes.flatMap((theme) => {
    const resolved = resolveTerminal(theme, ansiMapping);
    return TERMINAL_FORMATS.map(({ tool, ext, emit }) =>
      file(`${tool}/candela-${theme.id}.${ext}`, emit(resolved, theme)),
    );
  });

  return {
    files: [
      ...terminalFiles,
      ...vscodeFamilyFiles(themes, ansiMapping, licenseContent, iconContent, version),
      ...intellijFamilyFiles(themes, version),
      file('zed/extension.toml', zedExtensionToml('candela-themes', 'Candela Themes', version)),
      file('zed/themes/candela.json', json(zedFamily(themes, ansiMapping))),
      file('zed/README.md', zedReadme(themes)),
      ...sublimeFamilyFiles(themes),
      ...themes.map((theme) => nvimThemeFile(theme, ansiMapping, 'nvim/colors/')),
      ...themes.map((theme) => vimThemeFile(theme, ansiMapping, 'vim/')),
      ...themes.map((theme) => emacsThemeFile(theme, ansiMapping, 'emacs/')),
      ...themes.map((theme) => xcodeThemeFile(theme, 'xcode/')),
      ...themes.map((theme) => helixThemeFile(theme, 'helix/')),
      file('nvim/README.md', nvimReadme(themes)),
      file('obsidian/Candela/manifest.json', json(obsidianManifest(version))),
      file('obsidian/Candela/theme.css', obsidianThemeCss(themes)),
      file('obsidian/Candela/README.md', obsidianReadme),
    ],
  };
}
