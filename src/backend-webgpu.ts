/**
 * Optional WebGPU backend bundle.
 *
 * Importing the package registers the `webgpu` backend on the one TensorFlow.js
 * instance the reviewed browser runtime published as `globalThis.tf`. The
 * bundle is fetched only when a project asks for WebGPU or when automatic
 * negotiation finds a WebGPU adapter.
 */
import {webgpu_util} from '@tensorflow/tfjs-backend-webgpu';

type BackendGlobal = typeof globalThis & {
  tmBackendWebGPU?: unknown;
};

const backendGlobal = globalThis as BackendGlobal;

backendGlobal.tmBackendWebGPU = Object.freeze({
  registered: typeof webgpu_util === 'object'
});
