'use strict';

// Publishes the generated Zed and Sublime extension layouts to their dedicated
// distribution repos (schovi/candela-themes-{zed,sublime}), one tagged commit per
// release. Zed and Sublime both install straight from committed git contents, but
// this repo's build/ is gitignored — so the generated output has to live somewhere
// tracked. These repos are that somewhere; nothing here is hand-edited.
//
// Auth: in CI, pass DIST_PUSH_TOKEN (a PAT/fine-grained token with contents:write on
// both repos) — it gets embedded in the push URL. Locally, omit it and git uses your
// existing GitHub credentials (e.g. gh's credential helper).
//
// Usage: node scripts/publish-extension-repos.js [zed|sublime]  (default: both)

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const { version } = require(path.join(ROOT, 'package.json'));
const OWNER = 'schovi';
const TOKEN = process.env.DIST_PUSH_TOKEN || '';

const TARGETS = {
  zed: {
    repo: 'candela-themes-zed',
    srcDir: path.join(ROOT, 'build', 'zed'),
    readme: [
      '# Candela Themes — Zed',
      '',
      'Generated Zed extension for the Candela theme family.',
      '**Do not edit by hand** — source of truth is',
      `https://github.com/${OWNER}/candela-themes; this repo is republished on every release.`,
      '',
      'Install from Zed: `zed: extensions` → search "Candela".',
      '',
    ].join('\n'),
  },
  sublime: {
    repo: 'candela-themes-sublime',
    srcDir: path.join(ROOT, 'build', 'sublime'), // ships its own README.md + messages
    readme: null,
  },
};

function git(arguments_, cwd) {
  const result = spawnSync('git', arguments_, { cwd, stdio: ['inherit', 'inherit', 'inherit'] });
  if (result.error || result.status !== 0) {
    const detail = result.error ? result.error.message : `exit ${result.status}`;
    console.error(`\ngit ${arguments_.join(' ')} failed (${detail}).`);
    process.exit(result.status || 1);
  }
}

function remoteUrl(repo) {
  const host = TOKEN ? `x-access-token:${TOKEN}@github.com` : 'github.com';
  return `https://${host}/${OWNER}/${repo}.git`;
}

function publish(key) {
  const target = TARGETS[key];
  if (!fs.statSync(target.srcDir).isDirectory()) {
    console.error(`Missing generated layout: ${path.relative(ROOT, target.srcDir)} (run npm run build).`);
    process.exit(1);
  }

  const work = fs.mkdtempSync(path.join(os.tmpdir(), `candela-${key}-`));
  git(['clone', '--quiet', remoteUrl(target.repo), work]);

  // Replace all tracked content so a removed theme disappears downstream too;
  // .git is left intact by the pathspec.
  const tracked = spawnSync('git', ['ls-files'], { cwd: work, encoding: 'utf8' }).stdout.trim();
  if (tracked) git(['rm', '-rq', '.'], work);

  fs.cpSync(target.srcDir, work, { recursive: true });
  fs.copyFileSync(path.join(ROOT, 'LICENSE'), path.join(work, 'LICENSE'));
  if (target.readme) fs.writeFileSync(path.join(work, 'README.md'), target.readme);

  git(['config', 'user.name', 'github-actions[bot]'], work);
  git(['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], work);
  git(['add', '-A'], work);

  const status = spawnSync('git', ['status', '--porcelain'], { cwd: work, encoding: 'utf8' }).stdout.trim();
  if (!status) {
    console.log(`${target.repo}: no content change; skipping commit (tag v${version} still pushed if missing).`);
  } else {
    git(['commit', '-q', '-m', `release: v${version}`], work);
  }
  git(['tag', '-a', `v${version}`, '-m', `release: v${version}`], work);
  git(['push', 'origin', 'HEAD:main', '--follow-tags'], work);

  fs.rmSync(work, { recursive: true, force: true });
  console.log(`Published ${target.repo} @ v${version}.`);
}

const only = process.argv[2];
const keys = only ? [only] : Object.keys(TARGETS);
for (const key of keys) {
  if (!TARGETS[key]) {
    console.error(`Unknown target "${key}". Use one of: ${Object.keys(TARGETS).join(', ')}.`);
    process.exit(1);
  }
  publish(key);
}
