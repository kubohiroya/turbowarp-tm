/**
 * Optional WebAssembly backend bundle.
 *
 * The reviewed browser runtime (`dist/runtime.js`) ships the WebGL and CPU
 * kernels. This bundle is fetched only when a project asks for the WASM
 * backend, and it resolves `@tensorflow/tfjs-core` against the one TensorFlow.js
 * instance the runtime already published as `globalThis.tf`.
 */
import {
  getThreadsCount,
  setThreadsCount,
  setWasmPaths,
  version_wasm
} from '@tensorflow/tfjs-backend-wasm';

type BackendGlobal = typeof globalThis & {
  tmBackendWasm?: unknown;
};

const backendGlobal = globalThis as BackendGlobal;

backendGlobal.tmBackendWasm = Object.freeze({
  version: version_wasm,
  setWasmPaths,
  setThreadsCount,
  getThreadsCount
});
