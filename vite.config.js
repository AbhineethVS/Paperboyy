// Configures Vite for building Tailwind-driven CSS and minimal client JS into src/public/assets.
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  publicDir: false,
  build: {
    outDir: path.resolve(__dirname, 'src/public/assets'),
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'ui/main.js'),
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
