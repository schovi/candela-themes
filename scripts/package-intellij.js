'use strict';

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PLUGIN_DIR = path.join(ROOT, 'build', 'intellij');
const DIST = path.join(ROOT, 'dist');

function requireTool(command, versionArguments, prerequisite) {
  const result = spawnSync(command, versionArguments, { stdio: 'ignore' });
  if (result.error || result.status !== 0) {
    console.error(`Missing ${prerequisite}. Install it and ensure ${command} is on PATH.`);
    process.exit(1);
  }
}

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit ${result.status}`;
    console.error(`\n${path.basename(command)} failed (${detail}).`);
    process.exit(result.status || 1);
  }
}

requireTool('java', ['-version'], 'JDK 17 or newer');
requireTool('gradle', ['--version'], 'Gradle 9 or newer');

run(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], ROOT);
run('gradle', ['--no-daemon', 'buildPlugin'], PLUGIN_DIR);

const pluginXml = fs.readFileSync(
  path.join(PLUGIN_DIR, 'src', 'main', 'resources', 'META-INF', 'plugin.xml'),
  'utf8',
);
const versionMatch = pluginXml.match(/<version>([^<]+)<\/version>/);
if (!versionMatch) {
  console.error('Generated plugin.xml has no plugin version.');
  process.exit(1);
}

const distributions = path.join(PLUGIN_DIR, 'build', 'distributions');
const archives = fs.existsSync(distributions)
  ? fs.readdirSync(distributions).filter((file) => file.endsWith('.zip'))
  : [];
if (archives.length !== 1) {
  console.error(`Expected one plugin zip in ${path.relative(ROOT, distributions)}, found ${archives.length}.`);
  process.exit(1);
}

fs.mkdirSync(DIST, { recursive: true });
const output = path.join(DIST, `candela-themes-intellij-${versionMatch[1]}.zip`);
fs.copyFileSync(path.join(distributions, archives[0]), output);
console.log(`\nPackaged ${path.relative(ROOT, output)}.`);
