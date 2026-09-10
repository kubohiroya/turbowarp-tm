import {defineConfig} from 'vite';

/**
 * The optional WASM backend resolves TensorFlow.js against the one instance the
 * reviewed browser runtime already published as `globalThis.tf`, so the bundle
 * never carries a second copy of TensorFlow.js core.
 */
export default defineConfig({
  build: {
    emptyOutDir: false,
    lib: {
      entry: 'src/backend-wasm.ts',
      formats: ['iife'],
      name: 'TMBackendWasm',
      fileName: () => 'backend-wasm.js'
    },
    rollupOptions: {
      external: ['@tensorflow/tfjs-core'],
      output: {globals: {'@tensorflow/tfjs-core': 'tf'}}
    },
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2022'
  }
});
