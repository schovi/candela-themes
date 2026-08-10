'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const THEME_DIR = path.join(ROOT, 'build', 'obsidian');
const { version } = require(path.join(ROOT, 'package.json'));
const ARCHIVE = path.join(ROOT, 'dist', `candela-themes-obsidian-${version}.zip`);

const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (result.status !== 0) {
  console.error(`\nObsidian theme generation failed (exit ${result.status}).`);
  process.exit(result.status || 1);
}

for (const requiredPath of ['manifest.json', 'theme.css', 'README.md']) {
  if (!fs.statSync(path.join(THEME_DIR, 'Candela', requiredPath)).isFile()) {
    console.error(`Missing generated Obsidian theme file: ${requiredPath}`);
    process.exit(1);
  }
}

fs.mkdirSync(path.dirname(ARCHIVE), { recursive: true });
fs.rmSync(ARCHIVE, { force: true });
const zip = spawnSync('zip', ['-q', '-r', ARCHIVE, 'Candela'], { cwd: THEME_DIR, stdio: 'inherit' });
if (zip.error || zip.status !== 0) {
  const detail = zip.error ? zip.error.message : `exit ${zip.status}`;
  console.error(`\nzip failed (${detail}).`);
  process.exit(zip.status || 1);
}

console.log(`\nPackaged ${path.relative(ROOT, ARCHIVE)}.`);
