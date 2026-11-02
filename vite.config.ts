import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react(), {
    name: 'offline-build-assets',
    apply: 'build',
    async writeBundle(options, bundle) {
      const workerPath = resolve(options.dir ?? 'dist', 'sw.js');
      const worker = await readFile(workerPath, 'utf8');
      const assets = Object.keys(bundle).filter(name => /\.(js|css)$/.test(name)).sort();
      await writeFile(workerPath, worker.replace('const BUILD_ASSETS = [];', `const BUILD_ASSETS = ${JSON.stringify(assets)};`));
    },
  }],
});
