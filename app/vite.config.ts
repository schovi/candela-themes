import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The source-of-truth JSON lives above the app root (themes/), so allow Vite to
// read one level up. Fixed strictPort keeps screenshots deterministic.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5177,
    strictPort: true,
    fs: { allow: ['..'] },
  },
});
