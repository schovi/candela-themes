// Regenerate the theme gallery PNGs the root README references.
//
//   cd app && npm install && npx playwright install chromium   # one-time
//   cd app && npm run screenshots                              # regenerate all 14
//
// Starts the explorer's Vite dev server, opens each theme in screenshot mode
// (?theme=<id>&shot=1 — one chrome-free card that signals readiness once fonts
// load), and writes docs/screenshots/aurora-<id>.png. Playwright is a devDep of
// app/, so we resolve it from there rather than the repo root.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const APP_DIR = path.join(ROOT, 'app');
const OUT_DIR = path.join(ROOT, 'docs/screenshots');
const SOURCE = path.join(ROOT, 'docs/design-handover/aurora-themes.json');
const PORT = 5177;
const BASE = `http://localhost:${PORT}`;

const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require(path.join(APP_DIR, 'node_modules', 'playwright')));
} catch {
  console.error('Playwright not found. Run: cd app && npm install');
  process.exit(1);
}

const themeIds = JSON.parse(readFileSync(SOURCE, 'utf8')).themes.map((t) => t.id);

async function waitForServer(timeoutMs) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(BASE);
      if (res.ok) return;
    } catch {
      // server not up yet
    }
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`Vite dev server never came up on ${BASE}`);
}

const server = spawn('npm', ['run', 'dev'], { cwd: APP_DIR, stdio: 'ignore' });
let browser;
try {
  await waitForServer(30_000);
  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2 });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const id of themeIds) {
    await page.goto(`${BASE}/?theme=${id}&shot=1`, { waitUntil: 'load' });
    const state = await page.waitForFunction(
      () => document.documentElement.dataset.shotReady ?? null,
      { timeout: 15_000 },
    ).then((h) => h.jsonValue());
    if (state !== '1') throw new Error(`theme '${id}' did not render (shotReady=${state})`);
    const file = path.join(OUT_DIR, `aurora-${id}.png`);
    await page.locator('.theme-card').screenshot({ path: file });
    console.log(`wrote ${path.relative(ROOT, file)}`);
  }
  console.log(`\nDone — ${themeIds.length} screenshots in ${path.relative(ROOT, OUT_DIR)}/`);
} finally {
  if (browser) await browser.close();
  server.kill();
}
