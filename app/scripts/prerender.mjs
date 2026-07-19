import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createServer } from 'vite';

const EMPTY_ROOT = '<div id="root"></div>';

async function injectRenderedRoot(file, renderedRoot) {
  const outputPath = resolve('dist', file);
  const html = await readFile(outputPath, 'utf8');
  const firstRoot = html.indexOf(EMPTY_ROOT);

  if (firstRoot === -1 || html.indexOf(EMPTY_ROOT, firstRoot + 1) !== -1) {
    throw new Error(`${file} must contain exactly one empty #root shell`);
  }

  await writeFile(outputPath, html.replace(EMPTY_ROOT, `<div id="root">${renderedRoot}</div>`));
}

const vite = await createServer({
  appType: 'custom',
  logLevel: 'error',
  server: { middlewareMode: true },
});

try {
  const { renderHome, renderThemes } = await vite.ssrLoadModule('/src/prerender.tsx');
  await injectRenderedRoot('index.html', renderHome());
  await injectRenderedRoot('themes.html', renderThemes());
} finally {
  await vite.close();
}
