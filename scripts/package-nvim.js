'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PACKAGE_DIR = path.join(ROOT, 'build', 'nvim');
const DIST = path.join(ROOT, 'dist');
const { version } = require(path.join(ROOT, 'package.json'));
const OUTPUT = path.join(DIST, `candela-themes-nvim-${version}.tar.gz`);

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit ${result.status}`;
    console.error(`\n${path.basename(command)} failed (${detail}).`);
    process.exit(result.status || 1);
  }
}

run(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], ROOT);

for (const requiredPath of ['README.md', 'colors']) {
  if (!fs.existsSync(path.join(PACKAGE_DIR, requiredPath))) {
    console.error(`Missing generated Neovim plugin path: ${requiredPath}`);
    process.exit(1);
  }
}

fs.mkdirSync(DIST, { recursive: true });
fs.rmSync(OUTPUT, { force: true });

// System tar keeps packaging dependency-free; archive determinism is not a release invariant.
run('tar', ['-czf', OUTPUT, 'README.md', 'colors'], PACKAGE_DIR);

console.log(`\nPackaged ${path.relative(ROOT, OUTPUT)}.`);
