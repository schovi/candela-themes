import { useState } from 'react';
import { strToU8, zipSync } from 'fflate';
import { FORMAT_EMITTERS, installReadme } from '../../lib/emitters.js';
import { ansiMapping, type Theme } from './themes';

interface ExportControlsProps {
  theme: Theme;
  canExport: boolean;
}

function slugify(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'custom-theme';
}

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
  return { ...theme, id: slugify(theme.name) };
}

export function ExportControls({ theme, canExport }: ExportControlsProps) {
  const [selectedTool, setSelectedTool] = useState(FORMAT_EMITTERS[0].tool);
  const normalizedTheme = exportTheme(theme);

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
      <label>
        Target tool
        <select value={selectedTool} onChange={(event) => setSelectedTool(event.target.value)} id="format-export-tool">
          {FORMAT_EMITTERS.map((format) => <option key={format.tool} value={format.tool}>{format.label}</option>)}
        </select>
      </label>
      <button
        type="button"
        disabled={!canExport}
        onClick={() => downloadFormat(selectedTool)}
      >
        Download tool zip
      </button>
      <button type="button" disabled={!canExport} onClick={downloadFull}>Download full export</button>
    </div>
  );
}
