import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertWellFormedXml, swatchSvg } from '../lib/swatch.js';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, '..');
const APP_DIR = path.join(ROOT, 'app');
const SOURCE = path.join(ROOT, 'themes/candela-themes.json');
const OUT_DIR = path.join(ROOT, 'docs/swatches');
const PNG = process.argv.slice(2).includes('--png');

function failForTheme(theme, error) {
  const label = theme.id || theme.name || 'unknown theme';
  throw new Error(`Theme '${label}': ${error.message}`);
}

function createEntries(themes) {
  return themes.map((theme) => {
    try {
      const svg = swatchSvg(theme);
      assertWellFormedXml(svg);
      return { id: theme.id, svg };
    } catch (error) {
      failForTheme(theme, error);
    }
  });
}

function writeSvgs(entries) {
  mkdirSync(OUT_DIR, { recursive: true });
  for (const entry of entries) {
    const file = path.join(OUT_DIR, `candela-${entry.id}.svg`);
    writeFileSync(file, entry.svg);
    console.log(`wrote ${path.relative(ROOT, file)}`);
  }
}

async function writePngs(entries) {
  const require = createRequire(import.meta.url);
  let chromium;
  try {
    ({ chromium } = require(path.join(APP_DIR, 'node_modules', 'playwright')));
  } catch {
    throw new Error('Playwright not found. Run: cd app && npm install');
  }

  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 480, height: 150 }, deviceScaleFactor: 1 });
    for (const entry of entries) {
      const encoded = Buffer.from(entry.svg).toString('base64');
      await page.setContent(`<style>body { margin: 0; } img { display: block; }</style><img src="data:image/svg+xml;base64,${encoded}" width="480" height="150">`);
      await page.locator('img').screenshot({ path: path.join(OUT_DIR, `candela-${entry.id}.png`) });
      console.log(`wrote docs/swatches/candela-${entry.id}.png`);
    }
  } finally {
    await browser.close();
  }
}

const { themes } = JSON.parse(readFileSync(SOURCE, 'utf8'));
const entries = createEntries(themes);
writeSvgs(entries);
if (PNG) await writePngs(entries);
console.log(`\nDone, ${entries.length} SVG swatches in docs/swatches/${PNG ? ' plus PNGs' : ''}`);
