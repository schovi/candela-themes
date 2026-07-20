'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXTENSION_DIR = path.join(ROOT, 'build', 'zed');
const OUTPUT_DIR = path.join(ROOT, 'dist', 'zed');
const { version } = require(path.join(ROOT, 'package.json'));
const ARCHIVE = path.join(ROOT, 'dist', `candela-themes-zed-${version}.tar.gz`);

const result = spawnSync(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], {
  cwd: ROOT,
  stdio: 'inherit',
});
if (result.status !== 0) {
  console.error(`\nZed extension generation failed (exit ${result.status}).`);
  process.exit(result.status || 1);
}

for (const requiredPath of ['extension.toml', path.join('themes', 'candela.json')]) {
  if (!fs.statSync(path.join(EXTENSION_DIR, requiredPath)).isFile()) {
    console.error(`Missing generated Zed extension file: ${requiredPath}`);
    process.exit(1);
  }
}

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(path.dirname(OUTPUT_DIR), { recursive: true });
fs.cpSync(EXTENSION_DIR, OUTPUT_DIR, { recursive: true });

// A downloadable archive for GitHub Releases; the dev-install directory above stays
// for "Install Dev Extension". System tar keeps packaging dependency-free.
fs.rmSync(ARCHIVE, { force: true });
const tar = spawnSync('tar', ['-czf', ARCHIVE, '.'], { cwd: EXTENSION_DIR, stdio: 'inherit' });
if (tar.error || tar.status !== 0) {
  const detail = tar.error ? tar.error.message : `exit ${tar.status}`;
  console.error(`\ntar failed (${detail}).`);
  process.exit(tar.status || 1);
}

console.log(`\nPackaged ${path.relative(ROOT, OUTPUT_DIR)}/ and ${path.relative(ROOT, ARCHIVE)}.`);
