import {
  COMPUTE_MODES,
  normalizeComputeMode,
  selectComputeBackend,
  type ComputeBackendActivation,
  type ComputeBackendName,
  type ComputeBackendSelection,
  type ComputeMode
} from './compute-backend.js';

/** The slice of TensorFlow.js the compute runtime needs to negotiate a backend. */
export interface ComputeTensor {
  data(): Promise<ArrayLike<number>>;
}

export interface ComputeTensorFlowApi {
  getBackend(): string;
  setBackend(name: string): Promise<boolean>;
  ready(): Promise<void>;
  ones(shape: number[]): ComputeTensor;
  conv2d(input: any, filter: any, strides: number, pad: string): ComputeTensor;
  dispose(container: unknown): void;
}

/** Controls exported by an optional backend bundle once it has been loaded. */
export interface ComputeBackendModule {
  setWasmPaths?(prefix: string): void;
}

export interface ComputeRuntimeDependencies {
  readonly tf: ComputeTensorFlowApi;
  /** Loads the optional bundle that registers `backend`, or resolves to `null`. */
  loadBackend(backend: ComputeBackendName): Promise<ComputeBackendModule | null>;
  /** Absolute URL of the directory that holds the WebAssembly binaries. */
  wasmAssetBase(): string;
  hasWebGPU(): boolean;
  hasWebAssembly(): boolean;
}

export interface TMComputeRuntime {
  readonly modes: ReadonlyArray<ComputeMode>;
  select(mode?: unknown): Promise<ComputeBackendSelection>;
  getSelection(): ComputeBackendSelection | null;
  getMode(): ComputeMode;
  getBackend(): string;
  isBackendSupported(mode: unknown): boolean;
}

export function createComputeRuntime(
  dependencies: ComputeRuntimeDependencies
): TMComputeRuntime {
  const {tf} = dependencies;
  let selection: ComputeBackendSelection | null = null;
  let queue: Promise<unknown> = Promise.resolve();
  let wasmPathsConfigured = false;

  function supports(backend: ComputeBackendName): boolean {
    if (backend === 'webgpu') return dependencies.hasWebGPU();
    if (backend === 'wasm') return dependencies.hasWebAssembly();
    return true;
  }

  const activation: ComputeBackendActivation = {
    isSupported: supports,
    async prepare(backend) {
      const module = await dependencies.loadBackend(backend);
      if (backend !== 'wasm' || wasmPathsConfigured) return;
      if (typeof module?.setWasmPaths !== 'function') {
        throw new Error('the WebAssembly backend bundle did not expose setWasmPaths');
      }
      // TensorFlow.js refuses this call once the WASM backend has initialized,
      // so the binaries are pinned exactly once per page.
      module.setWasmPaths(dependencies.wasmAssetBase());
      wasmPathsConfigured = true;
    },
    async activate(backend) {
      const accepted = await tf.setBackend(backend);
      if (!accepted) return false;
      await tf.ready();
      return tf.getBackend() === backend;
    },
    async verify() {
      // An adapter can exist and a backend can register while the device still
      // fails to compile shaders, so a real convolution decides the question.
      const input = tf.ones([1, 4, 4, 1]);
      const filter = tf.ones([3, 3, 1, 1]);
      let output: ComputeTensor | null = null;
      try {
        output = tf.conv2d(input, filter, 1, 'valid');
        const values = await output.data();
        if (values.length !== 4 || Math.abs(Number(values[0]) - 9) > 1e-3) {
          throw new Error('the backend returned an incorrect convolution result');
        }
      } finally {
        tf.dispose([input, filter, ...(output ? [output] : [])]);
      }
    }
  };

  function enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = queue.then(operation, operation);
    queue = result.catch(() => undefined);
    return result;
  }

  return Object.freeze({
    modes: COMPUTE_MODES,
    select(rawMode?: unknown): Promise<ComputeBackendSelection> {
      const mode = normalizeComputeMode(rawMode);
      return enqueue(async () => {
        if (selection && selection.mode === mode && tf.getBackend() === selection.backend) {
          return selection;
        }
        selection = await selectComputeBackend(activation, mode);
        return selection;
      });
    },
    getSelection: () => selection,
    getMode: () => selection?.mode ?? 'auto',
    getBackend: () => tf.getBackend(),
    isBackendSupported(rawMode: unknown): boolean {
      const mode = normalizeComputeMode(rawMode);
      return mode === 'auto' || supports(mode);
    }
  });
}
