import {chmod, cp, mkdir, rm} from 'node:fs/promises';

/**
 * The WASM backend fetches its binary at run time. TurboWarp TM serves the
 * binaries from its own package so the extension keeps one pinned supply
 * instead of reaching for a second npm package on a CDN.
 */
const source = new URL(
  '../node_modules/@tensorflow/tfjs-backend-wasm/dist/',
  import.meta.url
);
const workerSource = new URL(
  '../node_modules/@tensorflow/tfjs-backend-wasm/wasm-out/tfjs-backend-wasm-threaded-simd.worker.js',
  import.meta.url
);
const destination = new URL('../dist/wasm/', import.meta.url);

const binaries = [
  'tfjs-backend-wasm.wasm',
  'tfjs-backend-wasm-simd.wasm',
  'tfjs-backend-wasm-threaded-simd.wasm'
];

await rm(destination, {force: true, recursive: true});
await mkdir(destination, {recursive: true});
const copied = [...binaries, 'tfjs-backend-wasm-threaded-simd.worker.js'];
for (const name of binaries) {
  await cp(new URL(name, source), new URL(name, destination));
}
await cp(workerSource, new URL('tfjs-backend-wasm-threaded-simd.worker.js', destination));
// The published files are static assets, so the mode stays independent of the
// executable bit npm happens to store on them.
for (const name of copied) {
  await chmod(new URL(name, destination), 0o644);
}
