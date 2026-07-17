'use strict';

// Packages the generated VS Code extension into a .vsix under dist/.
// Runs the build first so build/vscode/ is always fresh, then hands that folder
// to @vscode/vsce. Exits non-zero if either step fails.
//
// Unlike scripts/generate.js (zero runtime deps), this is tooling and may use
// the installed @vscode/vsce devDependency. Run `npm install` first.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const EXTENSION_DIR = path.join(ROOT, 'build', 'vscode');
const DIST = path.join(ROOT, 'dist');

function run(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit' });
  if (result.status !== 0) {
    console.error(`\n${path.basename(command)} failed (exit ${result.status}).`);
    process.exit(result.status || 1);
  }
}

run(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], ROOT);

const { name, version } = JSON.parse(
  fs.readFileSync(path.join(EXTENSION_DIR, 'package.json'), 'utf8'),
);
fs.mkdirSync(DIST, { recursive: true });
const outFile = path.join(DIST, `${name}-${version}.vsix`);

const vsceBin = path.join(ROOT, 'node_modules', '.bin', 'vsce');
run(vsceBin, ['package', '--out', outFile], EXTENSION_DIR);

console.log(`\nPackaged ${path.relative(ROOT, outFile)}.`);
