import * as tensorflow from '@tensorflow/tfjs';
import * as poseNet from '@tensorflow-models/posenet';
import * as speechCommands from '@tensorflow-models/speech-commands';
import * as teachableMachineImage from '@teachablemachine/image';
import * as teachableMachinePose from '@teachablemachine/pose';
import packageMetadata from '../package.json' with {type: 'json'};
import {createRuntimeModelFileLoader} from './runtime-model-loader.js';
import {
  createComputeRuntime,
  type ComputeBackendModule,
  type ComputeTensorFlowApi,
  type TMComputeRuntime
} from './runtime-compute.js';
import type {ComputeBackendName} from './compute-backend.js';

type RuntimeGlobal = typeof globalThis & {
  tf?: typeof tensorflow;
  speechCommands?: typeof speechCommands;
  tmImage?: typeof teachableMachineImage;
  tmPose?: typeof teachableMachinePose;
  tmAudio?: unknown;
  tmCompute?: TMComputeRuntime;
  tmBackendWasm?: ComputeBackendModule;
  tmBackendWebGPU?: unknown;
  [key: symbol]: unknown;
};

const runtimeGlobal = globalThis as RuntimeGlobal;
if (runtimeGlobal.tf !== undefined && runtimeGlobal.tf !== tensorflow) {
  throw new Error('TM browser runtime found a different global TensorFlow.js instance.');
}
if (runtimeGlobal.tmPose !== undefined && runtimeGlobal.tmPose !== teachableMachinePose) {
  throw new Error('TM browser runtime found a different global Teachable Machine Pose instance.');
}
if (runtimeGlobal.tmImage !== undefined && runtimeGlobal.tmImage !== teachableMachineImage) {
  throw new Error('TM browser runtime found a different global Teachable Machine Image instance.');
}
if (runtimeGlobal.speechCommands !== undefined && runtimeGlobal.speechCommands !== speechCommands) {
  throw new Error('TM browser runtime found a different global speech-commands instance.');
}

const dependencyVersions = packageMetadata.devDependencies;

/**
 * Optional backend bundles and the WebAssembly binaries sit next to this script.
 * `document.currentScript` is only readable while the script body runs, so the
 * directory is resolved once, here, and falls back to the version-pinned CDN
 * copy when the runtime is evaluated without a script element.
 */
const RUNTIME_ASSET_FALLBACK_BASE =
  `https://cdn.jsdelivr.net/npm/${packageMetadata.name}@${packageMetadata.version}/dist/`;

function resolveRuntimeAssetBase(): string {
  const script = typeof document === 'undefined' ? null : document.currentScript;
  const source = script && 'src' in script ? String(script.src ?? '') : '';
  if (source !== '') {
    try {
      return new URL('./', source).href;
    } catch {
      // A script element without a resolvable URL falls back to the CDN copy.
    }
  }
  return RUNTIME_ASSET_FALLBACK_BASE;
}

const runtimeAssetBase = resolveRuntimeAssetBase();
const runtimeScriptLoads = new Map<string, Promise<void>>();

function loadRuntimeScript(url: string): Promise<void> {
  const active = runtimeScriptLoads.get(url);
  if (active) return active;
  const promise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.addEventListener('load', () => resolve(), {once: true});
    script.addEventListener(
      'error',
      () => {
        runtimeScriptLoads.delete(url);
        reject(new Error(`TM: Failed to load compute backend bundle: ${url}`));
      },
      {once: true}
    );
    document.head.appendChild(script);
  });
  runtimeScriptLoads.set(url, promise);
  return promise;
}

async function loadBackendBundle(
  backend: ComputeBackendName
): Promise<ComputeBackendModule | null> {
  if (backend === 'wasm') {
    if (!runtimeGlobal.tmBackendWasm) {
      await loadRuntimeScript(new URL('backend-wasm.js', runtimeAssetBase).href);
    }
    return runtimeGlobal.tmBackendWasm ?? null;
  }
  if (backend === 'webgpu') {
    if (!runtimeGlobal.tmBackendWebGPU) {
      await loadRuntimeScript(new URL('backend-webgpu.js', runtimeAssetBase).href);
    }
  }
  return null;
}

const compute = createComputeRuntime({
  tf: tensorflow as unknown as ComputeTensorFlowApi,
  loadBackend: loadBackendBundle,
  wasmAssetBase: () => new URL('wasm/', runtimeAssetBase).href,
  hasWebGPU: () =>
    typeof navigator !== 'undefined' &&
    (navigator as Navigator & {gpu?: unknown}).gpu !== undefined &&
    (navigator as Navigator & {gpu?: unknown}).gpu !== null,
  hasWebAssembly: () =>
    typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function'
});

type PoseNetModelSettings = {
  modelSettings?: {
    posenet?: {
      architecture?: poseNet.PoseNetArchitecture;
      outputStride?: poseNet.PoseNetOutputStride;
      inputResolution?: poseNet.InputResolution;
      multiplier?: poseNet.MobileNetMultiplier;
    };
  };
};

/**
 * Teachable Machine records the PoseNet a model was trained against in its
 * metadata, and the classifier's input size is the flattened shape of that
 * PoseNet's output — a mismatch produces a feature vector the classifier cannot
 * accept. `tmPose.load()` already resolves these settings for the URL path, so
 * the file path resolves them the same way instead of assuming the defaults.
 */
function poseNetConfigFrom(metadata: unknown): poseNet.ModelConfig {
  const settings = (metadata as PoseNetModelSettings | null)?.modelSettings?.posenet ?? {};
  return {
    architecture: settings.architecture ?? 'MobileNetV1',
    outputStride: settings.outputStride ?? 16,
    inputResolution: settings.inputResolution ?? 257,
    multiplier: settings.multiplier ?? 0.75
  };
}

const loadFromFiles = createRuntimeModelFileLoader({
  ready: () => tensorflow.ready(),
  loadClassifier: (model, weights) =>
    tensorflow.loadLayersModel(tensorflow.io.browserFiles([model, weights])),
  async loadMetadata(metadata) {
    const value: unknown = await new Response(metadata).json();
    if (
      typeof value !== 'object' ||
      value === null ||
      !Array.isArray((value as {labels?: unknown}).labels)
    ) {
      throw new Error('Invalid Metadata provided');
    }
    return value;
  },
  loadPoseNet: (metadata) => poseNet.load(poseNetConfigFrom(metadata)),
  createModel: (classifier, loadedPoseNet, metadata) =>
    new teachableMachinePose.CustomPoseNet(
      classifier as tensorflow.LayersModel,
      loadedPoseNet as poseNet.PoseNet,
      metadata as teachableMachinePose.Metadata
    )
});
const runtime = Object.freeze({...teachableMachinePose, loadFromFiles});
const audioRuntime = Object.freeze({
  async load(modelURL: string, metadataURL: string) {
    const recognizer = speechCommands.create(
      'BROWSER_FFT',
      undefined,
      modelURL,
      metadataURL
    );
    await recognizer.ensureModelLoaded();
    return recognizer;
  }
});

runtimeGlobal.tf = tensorflow;
runtimeGlobal.speechCommands = speechCommands;
runtimeGlobal.tmImage = teachableMachineImage;
runtimeGlobal.tmPose = runtime;
runtimeGlobal.tmAudio = audioRuntime;
runtimeGlobal.tmCompute = compute;
const runtimeMetadata = Object.freeze({
  version: packageMetadata.version,
  tensorflow: dependencyVersions['@tensorflow/tfjs'],
  tensorflowBackendWasm: dependencyVersions['@tensorflow/tfjs-backend-wasm'],
  tensorflowBackendWebGPU: dependencyVersions['@tensorflow/tfjs-backend-webgpu'],
  speechCommands: dependencyVersions['@tensorflow-models/speech-commands'],
  teachableMachineImage: dependencyVersions['@teachablemachine/image'],
  teachableMachinePose: dependencyVersions['@teachablemachine/pose'],
  assetBase: runtimeAssetBase
});
runtimeGlobal[Symbol.for('@kubohiroya/turbowarp-tm/runtime')] = runtimeMetadata;
runtimeGlobal[Symbol.for('@kubohiroya/turbowarp-teachablemachine/runtime')] = runtimeMetadata;
