import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const swatchDirectory = new URL('../docs/swatches/', import.meta.url);
const importNode = (moduleName: string) => import(moduleName);

// Serve the clean URLs Cloudflare Pages exposes (/themes, /editor)
// locally too, so dev and preview nav match production. Build output is real
// static .html files.
function cleanUrls(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url === '/themes') req.url = '/themes.html';
    else if (req.url === '/editor') req.url = '/editor.html';
    next();
  };
  return {
    name: 'candela-clean-urls',
    // rewrite is a plain connect handler; cast avoids pulling in @types/node.
    configureServer: (server) => void server.middlewares.use(rewrite as never),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite as never),
  };
}

function swatchAssets(): Plugin {
  return {
    name: 'candela-swatch-assets',
    configureServer(server) {
      server.middlewares.use('/swatch', async (req, res, next) => {
        const id = /^\/([a-z0-9-]+)\.svg$/.exec((req as { url?: string }).url ?? '')?.[1];
        if (!id) return next();
        try {
          const fs = await importNode('node:fs/promises');
          res.setHeader('Content-Type', 'image/svg+xml');
          res.end(await fs.readFile(new URL(`candela-${id}.svg`, swatchDirectory)));
        } catch {
          next();
        }
      });
    },
    async generateBundle() {
      const fs = await importNode('node:fs/promises');
      const files = await fs.readdir(swatchDirectory);
      for (const file of files) {
        const id = /^candela-([a-z0-9-]+)\.svg$/.exec(file)?.[1];
        if (!id) continue;
        this.emitFile({
          type: 'asset',
          fileName: `swatch/${id}.svg`,
          source: await fs.readFile(new URL(file, swatchDirectory)),
        });
      }
    },
  };
}

// The source-of-truth JSON lives above the app root (themes/), so allow Vite to
// read one level up. Fixed strictPort keeps screenshots deterministic.
export default defineConfig({
  plugins: [react(), cleanUrls(), swatchAssets()],
  server: {
    port: 5177,
    strictPort: true,
    fs: { allow: ['..'] },
  },
  build: {
    rollupOptions: {
      input: {
        home: 'index.html',
        themes: 'themes.html',
        editor: 'editor.html',
      },
    },
  },
});
