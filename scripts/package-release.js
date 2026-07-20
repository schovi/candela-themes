'use strict';

// Release-only artifacts built on top of `npm run package`: one all-formats ZIP
// (every tool's loose files + an index) and a SHA256 manifest over the uploaded
// files. Reproducible from a clean checkout — regenerates build/ and reads only
// what package scripts already wrote to dist/.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const os = require('os');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const DIST = path.join(ROOT, 'dist');
const { version } = require(path.join(ROOT, 'package.json'));
const ALL_FORMATS = path.join(DIST, `candela-themes-all-formats-${version}.zip`);
const CHECKSUMS = path.join(DIST, 'SHA256SUMS.txt');

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit ${result.status}`;
    console.error(`\n${path.basename(command)} failed (${detail}).`);
    process.exit(result.status || 1);
  }
}

// Fresh build/ so the ZIP never depends on stale generated state.
run(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], ROOT);

const tools = fs
  .readdirSync(BUILD, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const index = [
  `# Candela Themes ${version} — all formats`,
  '',
  'Loose theme files for every supported tool. Pick your tool\'s folder and follow',
  'the per-tool install steps in the README:',
  'https://github.com/schovi/candela-themes#install',
  '',
  ...tools.map((tool) => `- \`${tool}/\``),
  '',
].join('\n');

// Stage build/ + INDEX under a versioned top-level folder so the ZIP extracts cleanly.
const staging = fs.mkdtempSync(path.join(os.tmpdir(), 'candela-release-'));
const stageRoot = path.join(staging, `candela-themes-${version}`);
fs.cpSync(BUILD, stageRoot, { recursive: true });
fs.writeFileSync(path.join(stageRoot, 'INDEX.md'), index);

fs.mkdirSync(DIST, { recursive: true });
fs.rmSync(ALL_FORMATS, { force: true });
run('zip', ['-rq', ALL_FORMATS, `candela-themes-${version}`], staging);
fs.rmSync(staging, { recursive: true, force: true });

// Checksums over every file uploaded to the release (top-level dist files only;
// the dist/zed/ dev-install dir ships as its own archive, not as loose files).
const uploads = fs
  .readdirSync(DIST, { withFileTypes: true })
  .filter((entry) => entry.isFile() && !entry.name.startsWith('.') && entry.name !== path.basename(CHECKSUMS))
  .map((entry) => entry.name)
  .sort();

const manifest = uploads
  .map((name) => {
    const hash = crypto.createHash('sha256').update(fs.readFileSync(path.join(DIST, name))).digest('hex');
    return `${hash}  ${name}`;
  })
  .join('\n');
fs.writeFileSync(CHECKSUMS, manifest + '\n');

console.log(`\nPackaged ${path.relative(ROOT, ALL_FORMATS)} and ${path.relative(ROOT, CHECKSUMS)} (${uploads.length} files).`);
