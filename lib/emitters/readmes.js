// Every human-read page shipped inside a generated package: the four store
// READMEs and the HTML fragments the JetBrains plugin.xml embeds. Listing copy
// itself lives in lib/copy.js — this module only arranges it.

import {
  DESCRIPTION,
  SUBLIME_DESCRIPTION,
  WHY_CANDELA,
  CUSTOMIZE,
  EDITOR_URL,
  EDITOR_LINK_TEXT,
} from '../copy.js';

const whyMarkdown = ['## Why Candela', '', ...WHY_CANDELA.map(([title, body]) => `- **${title}** — ${body}`)].join('\n');
export const whyHtml =
  '<h3>Why Candela</h3><ul>' + WHY_CANDELA.map(([title, body]) => `<li><b>${title}</b> — ${body}</li>`).join('') + '</ul>';
// Placed right after each README's install line rather than after the gallery:
// the gallery is two dozen full-width images, and anything below it is buried.
const customizeMarkdown = `${CUSTOMIZE} — [${EDITOR_LINK_TEXT}](${EDITOR_URL}).`;
export const customizeHtml = `<p>${CUSTOMIZE} — <a href="${EDITOR_URL}">${EDITOR_LINK_TEXT}</a>.</p>`;

export const GENERATED_NOTE = '> Generated from the Candela source of truth — do not edit by hand.';

// Committed gallery images are `examples/candela-<NN>-<id>.png`, where NN is the
// 1-based theme order (see docs/screenshots/README.md). The number is derived from
// the themes array rather than written out, so reordering themes can't leave these
// URLs pointing at a 404 the way the pre-`examples/` paths silently did.
//
// raw.githubusercontent.com, never github.com/…/raw/… — the latter 302s, and
// packagecontrol.io re-hosts readme images through its own downloader and silently
// deletes any <img> whose fetch throws (app/lib/readme_images.py). Direct URL, no hop.
const RAW_BASE = 'https://raw.githubusercontent.com/schovi/candela-themes/main';
const shotUrl = (id) => `${RAW_BASE}/docs/screenshots/examples/candela-${id}.png`;

// Every theme, in source order, captioned with its own name — the full gallery, not a
// hand-picked three. Store listings are where people decide, and a theme absent from
// the previews is a theme nobody installs. The images are remote (raw.githubusercontent),
// so a 16-shot gallery costs the package nothing.
//
// Every README places this LAST, after its install instructions: sixteen full-width
// screenshots are a long scroll, and anything below them is effectively unread.
// `noun` exists for Sublime, where "theme" means a UI theme and a syntax palette is a
// color scheme; every other surface takes the default.
const previewMarkdown = (themes, noun = 'theme') =>
  [
    `## Every ${noun}`,
    '',
    `All ${themes.length} ${noun}s, each shown across terminal, TypeScript, Markdown, and git panes.`,
    '',
    ...themes.flatMap((theme) => [
      `**${theme.name}** — ${theme.mode}`,
      '',
      `![${theme.name}](${shotUrl(theme.id)})`,
      '',
    ]),
  ]
    .join('\n')
    .trimEnd();

// One skeleton for all four store READMEs: title, pitch, hero shots, the Why
// list, per-tool install steps, the editor pitch, then the full gallery.
const packageReadme = ({ title, description, images, install, themes, noun }) =>
  [
    `# ${title}`,
    '',
    description,
    '',
    ...images.flatMap((image) => [image, '']),
    whyMarkdown,
    '',
    ...install,
    '',
    customizeMarkdown,
    '',
    previewMarkdown(themes, noun),
    '',
    GENERATED_NOTE,
    '',
  ].join('\n');

export const vscodeReadme = (themes) =>
  packageReadme({
    title: 'Candela Themes',
    description: DESCRIPTION,
    // Real-editor, full-window shots lead, same as Sublime and Zed: the app-rendered
    // gallery below shows an editor pane only, and its sepia card would repeat here
    // verbatim. See docs/screenshots/README.md.
    images: [
      `![Candela in VS Code, light](${RAW_BASE}/docs/screenshots/vscode/vscode-light.png)`,
      `![Candela in VS Code, dark](${RAW_BASE}/docs/screenshots/vscode/vscode-dark.png)`,
    ],
    install: ['After installing, open **Preferences: Color Theme** and pick any *Candela …* entry.'],
    themes,
  });

export const sublimeReadme = (themes) =>
  packageReadme({
    // Sublime reserves "theme" for UI themes; syntax palettes are "color schemes".
    title: 'Candela Color Schemes for Sublime Text',
    description: SUBLIME_DESCRIPTION,
    // Real-editor, full-window shots lead instead of the app-rendered sepia hero: that one
    // repeats verbatim in the gallery below, and only these show what Adaptive does to the
    // chrome. Sublime is the only surface with them; see docs/screenshots/README.md.
    images: [
      `![Candela on Adaptive, light](${RAW_BASE}/docs/screenshots/sublime/sublime-light.png)`,
      `![Candela on Adaptive, dark](${RAW_BASE}/docs/screenshots/sublime/sublime-dark.png)`,
    ],
    install: [
      'After installing, choose a Candela scheme from **Preferences > Select Color Scheme**.',
      '',
      'Candela then offers to switch the UI theme to Adaptive, which extends the palette to the',
      'sidebar, tabs and status bar — every other UI theme keeps its own grays. Decline it and',
      'only the editor recolors; you can turn it on later with **Candela: Color the sidebar, tabs',
      'and status bar too** in the command palette, or by hand with `"theme": "Adaptive.sublime-theme"`.',
    ],
    themes,
    noun: 'color scheme',
  });

export const zedReadme = (themes) =>
  packageReadme({
    title: 'Candela Themes for Zed',
    description: DESCRIPTION,
    // Same reasoning as Sublime: real-editor, full-window shots lead, because the
    // app-rendered gallery below shows an editor pane only and cannot show what a
    // theme does to the sidebar, tabs and status bar. See docs/screenshots/README.md.
    images: [
      `![Candela in Zed, light](${RAW_BASE}/docs/screenshots/zed/zed-light.png)`,
      `![Candela in Zed, dark](${RAW_BASE}/docs/screenshots/zed/zed-dark.png)`,
    ],
    install: [
      'Install from Zed: `zed: extensions` → search "Candela", then pick any *Candela …* entry',
      'in the theme selector. Each theme colors the whole window — editor, sidebar, tabs,',
      "status bar and integrated terminal — so nothing is left on Zed's default gray.",
    ],
    themes,
  });

export const nvimReadme = (themes) =>
  packageReadme({
    title: 'Candela Themes for Neovim',
    description: DESCRIPTION,
    images: [`![Candela preview](${shotUrl('sepia-paper')})`],
    install: [
      '## Install',
      '',
      'Every colorscheme is self-contained and requires no Neovim plugins.',
      'Extract the release archive, then install that directory with your plugin manager.',
      'For lazy.nvim:',
      '',
      '```lua',
      "{ dir = '/path/to/candela-themes-nvim' }",
      '```',
      '',
      'For a manual install, copy `colors/` into a directory on your Neovim runtimepath.',
      'Then run `:colorscheme candela-sepia-paper` (or another Candela theme id).',
    ],
    themes,
  });
