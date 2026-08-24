import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      util: resolve('src/runtime-util-shim.ts')
    }
  },
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/runtime.ts',
      formats: ['iife'],
      name: 'TMPoseBrowserRuntime',
      fileName: () => 'runtime.js'
    },
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2022'
  }
});
