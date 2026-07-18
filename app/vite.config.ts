import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Serve the clean URLs Cloudflare Pages exposes (/themes, /lab) locally too, so
// dev and preview nav match production. Build output is real static .html files.
function cleanUrls(): Plugin {
  const rewrite = (req: { url?: string }, _res: unknown, next: () => void) => {
    if (req.url === '/themes') req.url = '/themes.html';
    else if (req.url === '/lab') req.url = '/lab.html';
    next();
  };
  return {
    name: 'aurora-clean-urls',
    // rewrite is a plain connect handler; cast avoids pulling in @types/node.
    configureServer: (server) => void server.middlewares.use(rewrite as never),
    configurePreviewServer: (server) => void server.middlewares.use(rewrite as never),
  };
}

// The source-of-truth JSON lives above the app root (themes/), so allow Vite to
// read one level up. Fixed strictPort keeps screenshots deterministic.
export default defineConfig({
  plugins: [react(), cleanUrls()],
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
        lab: 'lab.html',
      },
    },
  },
});
