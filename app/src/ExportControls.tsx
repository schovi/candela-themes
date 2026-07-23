import { useState, type ReactNode } from 'react';
import { strToU8, zipSync } from 'fflate';
import { FORMAT_EMITTERS, installReadme } from '../../lib/emitters.js';
import { ansiMapping, type Theme } from './themes';
import { slugify } from './derive';

interface ExportControlsProps {
  theme: Theme;
  canExport: boolean;
  onCopyShareLink: () => void;
  shareLinkCopied: boolean;
  draftJsonButton: ReactNode;
  copyJsonButton: ReactNode;
}

const FORMAT_DESCRIPTIONS: Record<string, string> = {
  iterm2: 'A ready-to-import iTerm2 color preset and its install guide.',
  alacritty: 'An Alacritty TOML theme and its install guide.',
  kitty: 'A Kitty configuration theme and its install guide.',
  wezterm: 'A WezTerm TOML theme and its install guide.',
  'windows-terminal': 'A Windows Terminal color-scheme fragment and its install guide.',
  ghostty: 'A Ghostty configuration theme and its install guide.',
  vscode: 'A single-theme VS Code extension and its install guide.',
  intellij: 'A single-theme IntelliJ plugin project and its install guide.',
  zed: 'A Zed theme extension and its install guide.',
  sublime: 'A Sublime Text color-scheme file and its install guide.',
  nvim: 'A Neovim Lua colorscheme and its install guide.',
  helix: 'A Helix TOML theme and its install guide.',
};

function downloadZip(name: string, files: Map<string, string>): void {
  const entries = Object.fromEntries(
    [...files].map(([path, content]) => [path, strToU8(content)]),
  );
  const url = URL.createObjectURL(new Blob([zipSync(entries)], { type: 'application/zip' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function exportTheme(theme: Theme): Theme {
  return { ...theme, id: slugify(theme.name, 'custom-theme') };
}

export function ExportControls({ theme, canExport, onCopyShareLink, shareLinkCopied, draftJsonButton, copyJsonButton }: ExportControlsProps) {
  const [selectedTool, setSelectedTool] = useState(FORMAT_EMITTERS[0].tool);
  const normalizedTheme = exportTheme(theme);
  const selectedFormat = FORMAT_EMITTERS.find((format) => format.tool === selectedTool) ?? FORMAT_EMITTERS[0];

  const downloadFormat = (tool: string) => {
    if (!canExport) return;
    const format = FORMAT_EMITTERS.find((candidate) => candidate.tool === tool);
    if (!format) return;
    const files = new Map(format.emit(normalizedTheme, ansiMapping).files.map((file) => [file.path, file.content]));
    files.set('README.md', installReadme(tool, normalizedTheme));
    downloadZip(`${normalizedTheme.id}-${tool}.zip`, files);
  };

  const downloadFull = () => {
    if (!canExport) return;
    const files = new Map<string, string>();
    for (const format of FORMAT_EMITTERS) {
      for (const file of format.emit(normalizedTheme, ansiMapping).files) {
        files.set(`${format.tool}/${file.path}`, file.content);
      }
      files.set(`${format.tool}/README.md`, installReadme(format.tool, normalizedTheme));
    }
    files.set(`${normalizedTheme.id}.json`, JSON.stringify(normalizedTheme, null, 2) + '\n');
    files.set('README.md', [
      `# ${normalizedTheme.name}`,
      '',
      'This archive contains ready-to-use packages for every supported tool.',
      '',
      ...FORMAT_EMITTERS.map((format) => `- [${format.label}](${format.tool}/README.md)`),
      '',
    ].join('\n'));
    downloadZip(`${normalizedTheme.id}-all-formats.zip`, files);
  };

  return (
    <div className="format-export">
      <div className="fx-primary">
        <label>
          Target tool
          <select value={selectedTool} onChange={(event) => setSelectedTool(event.target.value)} id="format-export-tool">
            {FORMAT_EMITTERS.map((format) => <option key={format.tool} value={format.tool}>{format.label}</option>)}
          </select>
        </label>
        <button
          type="button"
          className="fx-download"
          disabled={!canExport}
          onClick={() => downloadFormat(selectedTool)}
        >
          Download for {selectedFormat.label}
        </button>
        <span className="fx-or">or</span>
        <button type="button" className="fx-download-all" disabled={!canExport} onClick={downloadFull} title="Every tool, every manual, one zip.">Download all</button>
        <p className="fx-caption">{FORMAT_DESCRIPTIONS[selectedFormat.tool]} <a href="https://github.com/schovi/candela-themes#install">Install instructions →</a></p>
      </div>
      <div className="fx-secondary">
        {draftJsonButton}
        <span className="fx-caption">An editable JSON copy you can reopen later, even before it validates.</span>
        {copyJsonButton}
        <span className="fx-caption">Copy the full theme definition (colors, fonts, metadata) as JSON to your clipboard.</span>
        <button type="button" onClick={onCopyShareLink}>{shareLinkCopied ? 'Copied!' : 'Copy link'}</button>
        <span className="fx-caption">Copy a shareable link that reopens this exact draft in the editor.</span>
      </div>
    </div>
  );
}
