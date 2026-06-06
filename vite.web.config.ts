import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  root: 'src',
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron'),
      '@tests': resolve(__dirname, 'tests'),
    },
  },
  server: { port: 5173, strictPort: true },
  build: {
    outDir: '../out/renderer-test',
    emptyOutDir: true,
  },
});
