'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const BUILD = path.join(ROOT, 'build');
const DIST = path.join(ROOT, 'dist');
const { version } = require(path.join(ROOT, 'package.json'));
const { themes } = require(path.join(ROOT, 'themes', 'candela-themes.json'));

const bundles = [
  {
    tool: 'iterm2',
    extension: '.itermcolors',
    install: 'In iTerm2, open Settings > Profiles > Colors, choose Color Presets... > Import..., select a theme file, then choose it from Color Presets....',
  },
  {
    tool: 'alacritty',
    extension: '.toml',
    install: 'Copy a theme file to your Alacritty configuration directory, then import it from alacritty.toml with an import entry.',
  },
  {
    tool: 'kitty',
    extension: '.conf',
    install: 'Copy a theme file to the Kitty configuration directory, then add an include line for it to kitty.conf and reload Kitty.',
  },
  {
    tool: 'wezterm',
    extension: '.toml',
    install: 'Copy a theme file into the colors directory under your WezTerm configuration directory, then set color_scheme to its theme name in wezterm.lua.',
  },
  {
    tool: 'windows-terminal',
    extension: '.json',
    archive: 'zip',
    install: 'Each theme file is a JSON fragment. Merge the selected fragment into the schemes array in Windows Terminal settings.json; do not replace settings.json with it. Then select the scheme in the profile settings.',
  },
  {
    tool: 'ghostty',
    extension: '.conf',
    install: 'Copy a theme file to the Ghostty themes directory, then set theme to the file name without the .conf extension in the Ghostty configuration.',
  },
  {
    tool: 'helix',
    extension: '.toml',
    install: 'Copy a theme file to the themes directory under your Helix configuration directory, then select the file name without the .toml extension using :theme or set theme in config.toml.',
  },
];

function run(command, arguments_, cwd) {
  const result = spawnSync(command, arguments_, { cwd, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit ${result.status}`;
    console.error(`\n${path.basename(command)} failed (${detail}).`);
    process.exit(result.status || 1);
  }
}

function packageBundle(bundle) {
  const sourceDirectory = path.join(BUILD, bundle.tool);
  const themeFiles = fs.readdirSync(sourceDirectory)
    .filter((file) => file.endsWith(bundle.extension))
    .sort();

  if (themeFiles.length !== themes.length) {
    console.error(
      `Expected ${themes.length} generated ${bundle.tool} theme files, found ${themeFiles.length}.`,
    );
    process.exit(1);
  }

  const stagingDirectory = fs.mkdtempSync(path.join(os.tmpdir(), `candela-${bundle.tool}-`));
  try {
    for (const file of themeFiles) {
      fs.copyFileSync(path.join(sourceDirectory, file), path.join(stagingDirectory, file));
    }
    fs.writeFileSync(
      path.join(stagingDirectory, 'README.txt'),
      `Candela Themes for ${bundle.tool}\n\n${bundle.install}\n`,
    );

    const archiveExtension = bundle.archive === 'zip' ? 'zip' : 'tar.gz';
    const output = path.join(DIST, `candela-themes-${bundle.tool}-${version}.${archiveExtension}`);
    fs.rmSync(output, { force: true });

    // System archive tools keep this release path dependency-free.
    if (bundle.archive === 'zip') {
      run('zip', ['-q', output, 'README.txt', ...themeFiles], stagingDirectory);
    } else {
      run('tar', ['-czf', output, 'README.txt', ...themeFiles], stagingDirectory);
    }
    console.log(`Packaged ${path.relative(ROOT, output)} (${themeFiles.length} themes).`);
  } finally {
    fs.rmSync(stagingDirectory, { recursive: true, force: true });
  }
}

run(process.execPath, [path.join(ROOT, 'scripts', 'generate.js')], ROOT);
fs.mkdirSync(DIST, { recursive: true });
for (const bundle of bundles) packageBundle(bundle);
