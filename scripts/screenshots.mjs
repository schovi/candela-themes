// Regenerate the theme gallery PNGs the root README references.
//
//   cd app && npm install && npx playwright install chromium   # one-time
//   cd app && npm run screenshots                              # regenerate all themes
//
// Starts the explorer's Vite dev server, opens each theme in screenshot mode
// (?theme=<id>&shot=1 — one chrome-free card that signals readiness once fonts
// load), and writes docs/screenshots/candela-<id>.png (ids are stable; theme
// order). Playwright is a devDep of
// app/, so we resolve it from there rather than the repo root.

import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const APP_DIR = path.join(ROOT, 'app');
const SOURCE = path.join(ROOT, 'themes/candela-themes.json');
const PORT = 5177;
const BASE = `http://localhost:${PORT}`;

// By default each shot is the full card at its natural height (only the width is
// pinned, so tiles never clip). Pass --height to force an exact WIDTHxHEIGHT frame
// (clipped/padded) for a marketplace that wants uniform dimensions, e.g.
//   node scripts/screenshots.mjs --width=1200 --height=760 --scale=2 \
//     --panes=terminal,typescript --out=docs/screenshots/jetbrains
const flags = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = ''] = a.replace(/^--/, '').split('=');
    return [k, v];
  }),
);
const WIDTH = Number(flags.width) || 1280;
const HEIGHT = flags.height !== undefined ? Number(flags.height) : null;
const SCALE = Number(flags.scale) || 2;
const PANES = flags.panes ?? '';
// --meta=0 drops the name/description/swatch legend, freeing the whole frame for panes.
const META = flags.meta !== '0';
// --out resolves from the repo root; use ../ or an absolute path to target outside it.
const OUT_DIR = path.resolve(ROOT, flags.out || 'docs/screenshots');

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
  // Fixed frame: viewport is the exact clip size. Natural: roomy viewport, then
  // the element screenshot captures the full card regardless of viewport height.
  const page = await browser.newPage({
    viewport: { width: WIDTH, height: HEIGHT ?? 900 },
    deviceScaleFactor: SCALE,
  });
  mkdirSync(OUT_DIR, { recursive: true });

  for (const [index, id] of themeIds.entries()) {
    // Fixed-height shots fill the frame (card paints theme bg edge-to-edge, panes
    // stretch) so there is no page-background strip below a short card.
    const url = `${BASE}/?theme=${id}&shot=1${PANES ? `&panes=${encodeURIComponent(PANES)}` : ''}${HEIGHT !== null ? '&fill=1' : ''}${META ? '' : '&meta=0'}`;
    await page.goto(url, { waitUntil: 'load' });
    const state = await page.waitForFunction(
      () => document.documentElement.dataset.shotReady ?? null,
      { timeout: 15_000 },
    ).then((h) => h.jsonValue());
    if (state !== '1') throw new Error(`theme '${id}' did not render (shotReady=${state})`);
    const file = path.join(OUT_DIR, `candela-${id}.png`);
    if (HEIGHT !== null) {
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT } });
    } else {
      await page.locator('.theme-card').screenshot({ path: file });
    }
    console.log(`wrote ${path.relative(ROOT, file)}`);
  }
  console.log(`\nDone — ${themeIds.length} screenshots in ${path.relative(ROOT, OUT_DIR)}/`);
} finally {
  if (browser) await browser.close();
  server.kill();
}
