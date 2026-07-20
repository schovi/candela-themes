'use strict';

const fs = require('fs');
const path = require('path');
const { emitFullFamily, FORMAT_EMITTERS } = require('../lib/emitters');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'themes/candela-themes.json');
const BUILD = path.join(ROOT, 'build');

function main() {
  const { themes, ansiMapping } = JSON.parse(fs.readFileSync(SOURCE, 'utf8'));
  const licenseContent = fs.readFileSync(path.join(ROOT, 'LICENSE'), 'utf8');
  const iconContent = fs.readFileSync(path.join(ROOT, 'assets/icon/candela-icon-128.png'));
  const { files } = emitFullFamily(themes, ansiMapping, licenseContent, iconContent);

  fs.rmSync(BUILD, { recursive: true, force: true });
  for (const output of files) {
    const destination = path.join(BUILD, output.path);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.writeFileSync(destination, output.content);
  }

  const terminalCount = themes.length * 6;
  console.log(`Generated ${terminalCount} files for ${themes.length} themes across 6 formats.`);
  console.log(`Generated build/vscode/ extension: package.json + ${themes.length} theme files.`);
  console.log(`Generated build/intellij/ plugin: plugin.xml + ${themes.length} editor schemes (.xml + .icls) + ${themes.length} .theme.json.`);
  console.log(`Generated build/zed/candela.json family with ${themes.length} themes.`);
  console.log(`Generated build/sublime/ ${themes.length} .sublime-color-scheme files.`);
  console.log(`Generated build/nvim/ ${themes.length} Lua colorschemes.`);
  console.log(`Generated build/helix/ ${themes.length} .toml themes.`);
  if (FORMAT_EMITTERS.length !== 12) throw new Error('Expected 12 export formats.');
}

main();
