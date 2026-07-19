'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PACKAGE_DIR = path.join(ROOT, 'build', 'sublime');
const DIST = path.join(ROOT, 'dist');
const OUTPUT = path.join(DIST, 'candela-themes.sublime-package');

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit ${result.status}`;
    console.error(`\n${path.basename(command)} failed (${detail}).`);
    process.exit(result.status || 1);
  }
}

run(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], ROOT);

for (const requiredPath of ['README.md', 'messages.json', path.join('messages', 'install.txt')]) {
  if (!fs.existsSync(path.join(PACKAGE_DIR, requiredPath))) {
    console.error(`Missing generated Sublime package file: ${requiredPath}`);
    process.exit(1);
  }
}

fs.mkdirSync(DIST, { recursive: true });
fs.rmSync(OUTPUT, { force: true });
run('zip', ['-q', '-r', OUTPUT, '.'], PACKAGE_DIR);

console.log(`\nPackaged ${path.relative(ROOT, OUTPUT)}.`);
