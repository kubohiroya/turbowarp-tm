import {describe, expect, it, vi} from 'vitest';
import {
  AUTO_COMPUTE_BACKEND_ORDER,
  COMPUTE_MODES,
  ComputeBackendUnavailableError,
  computeBackendCandidates,
  isComputeMode,
  normalizeComputeMode,
  requireComputeMode,
  selectComputeBackend,
  type ComputeBackendActivation,
  type ComputeBackendName
} from '../src/compute-backend.js';
import {createComputeRuntime, type ComputeTensorFlowApi} from '../src/runtime-compute.js';

function activation(
  overrides: Partial<ComputeBackendActivation> = {}
): ComputeBackendActivation {
  return {
    isSupported: () => true,
    prepare: () => undefined,
    activate: () => true,
    verify: () => undefined,
    ...overrides
  };
}

describe('compute mode normalization', () => {
  it('lists auto first so the menu default negotiates the fastest backend', () => {
    expect(COMPUTE_MODES[0]).toBe('auto');
    expect(AUTO_COMPUTE_BACKEND_ORDER).toEqual(['webgpu', 'webgl', 'wasm', 'cpu']);
  });

  it('accepts documented aliases and falls back for unknown input', () => {
    expect(normalizeComputeMode('WebGPU')).toBe('webgpu');
    expect(normalizeComputeMode(' WebAssembly ')).toBe('wasm');
    expect(normalizeComputeMode('自動')).toBe('auto');
    expect(normalizeComputeMode('')).toBe('auto');
    expect(normalizeComputeMode(undefined, 'wasm')).toBe('wasm');
    expect(normalizeComputeMode('quantum', 'webgl')).toBe('webgl');
  });

  it('rejects unknown modes when the caller cannot silently fall back', () => {
    expect(requireComputeMode('cpu')).toBe('cpu');
    expect(() => requireComputeMode('quantum')).toThrow(TypeError);
    expect(() => requireComputeMode('')).toThrow(TypeError);
    expect(isComputeMode('webgl')).toBe(true);
    expect(isComputeMode('quantum')).toBe(false);
  });

  it('tries a named backend first and keeps the standard order behind it', () => {
    expect(computeBackendCandidates('auto')).toEqual(['webgpu', 'webgl', 'wasm', 'cpu']);
    expect(computeBackendCandidates('wasm')).toEqual(['wasm', 'webgpu', 'webgl', 'cpu']);
    expect(computeBackendCandidates('cpu')).toEqual(['cpu', 'webgpu', 'webgl', 'wasm']);
  });
});

describe('selectComputeBackend', () => {
  it('activates the first backend that supports, accepts, and verifies', async () => {
    const prepare = vi.fn(async () => undefined);
    const selection = await selectComputeBackend(activation({prepare}), 'auto');

    expect(selection.backend).toBe('webgpu');
    expect(selection.requested).toBeNull();
    expect(selection.fallback).toBe(false);
    expect(selection.attempts).toEqual([]);
    expect(prepare).toHaveBeenCalledWith('webgpu');
  });

  it('skips unsupported backends and records why', async () => {
    const selection = await selectComputeBackend(
      activation({isSupported: (backend) => backend !== 'webgpu'}),
      'auto'
    );

    expect(selection.backend).toBe('webgl');
    expect(selection.fallback).toBe(false);
    expect(selection.attempts).toEqual([
      {backend: 'webgpu', reason: 'not supported by this browser'}
    ]);
  });

  it('falls back when a registered backend cannot run a convolution', async () => {
    const selection = await selectComputeBackend(
      activation({
        verify(backend) {
          if (backend === 'webgpu') throw new Error('shader compilation failed');
        }
      }),
      'webgpu'
    );

    expect(selection.backend).toBe('webgl');
    expect(selection.requested).toBe('webgpu');
    expect(selection.fallback).toBe(true);
    expect(selection.attempts).toEqual([
      {backend: 'webgpu', reason: 'shader compilation failed'}
    ]);
  });

  it('treats a refused switch as a failed attempt', async () => {
    const selection = await selectComputeBackend(
      activation({activate: (backend) => backend === 'cpu'}),
      'auto'
    );

    expect(selection.backend).toBe('cpu');
    expect(selection.attempts.map((attempt) => attempt.backend)).toEqual([
      'webgpu',
      'webgl',
      'wasm'
    ]);
    expect(selection.attempts[0]?.reason).toBe(
      'TensorFlow.js did not switch to this backend'
    );
  });

  it('reports every attempt when no backend is usable', async () => {
    const failure = selectComputeBackend(
      activation({
        prepare(backend: ComputeBackendName) {
          throw new Error(`${backend} bundle is missing`);
        }
      }),
      'auto'
    );

    await expect(failure).rejects.toBeInstanceOf(ComputeBackendUnavailableError);
    const error = await failure.catch((value: ComputeBackendUnavailableError) => value);
    expect(error.code).toBe('TM-COMPUTE-UNAVAILABLE');
    expect(error.attempts).toHaveLength(4);
    expect(error.message).toContain('webgpu: webgpu bundle is missing');
  });
});

function tensorFlowDouble(overrides: Partial<ComputeTensorFlowApi> = {}) {
  let active = 'cpu';
  const disposed: unknown[] = [];
  const api: ComputeTensorFlowApi = {
    getBackend: () => active,
    setBackend: vi.fn(async (name: string) => {
      active = name;
      return true;
    }),
    ready: vi.fn(async () => undefined),
    ones: vi.fn((shape: number[]) => ({shape, data: async () => new Float32Array(0)})),
    conv2d: vi.fn(() => ({data: async () => new Float32Array([9, 9, 9, 9])})),
    dispose: vi.fn((container: unknown) => {
      disposed.push(container);
    }),
    ...overrides
  };
  return {api, disposed, setActive: (name: string) => (active = name)};
}

describe('createComputeRuntime', () => {
  it('pins the WebAssembly binaries exactly once and reports the selection', async () => {
    const {api} = tensorFlowDouble();
    const setWasmPaths = vi.fn();
    const runtime = createComputeRuntime({
      tf: api,
      loadBackend: async () => ({setWasmPaths}),
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => false,
      hasWebAssembly: () => true
    });

    const selection = await runtime.select('wasm');
    expect(selection.backend).toBe('wasm');
    expect(runtime.getBackend()).toBe('wasm');
    expect(runtime.getSelection()).toBe(selection);
    expect(runtime.getMode()).toBe('wasm');
    expect(setWasmPaths).toHaveBeenCalledExactlyOnceWith('https://example.test/dist/wasm/');

    await runtime.select('wasm');
    expect(setWasmPaths).toHaveBeenCalledOnce();
  });

  it('verifies a backend with a real convolution and releases its tensors', async () => {
    const {api, disposed} = tensorFlowDouble();
    const runtime = createComputeRuntime({
      tf: api,
      loadBackend: async () => null,
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => true,
      hasWebAssembly: () => true
    });

    await runtime.select('webgpu');

    expect(api.conv2d).toHaveBeenCalledOnce();
    expect(api.ones).toHaveBeenCalledTimes(2);
    expect(disposed).toHaveLength(1);
    expect(disposed[0]).toHaveLength(3);
  });

  it('keeps only the backend whose convolution is correct', async () => {
    const double = tensorFlowDouble();
    const api: ComputeTensorFlowApi = {
      ...double.api,
      conv2d: vi.fn(() => ({
        data: async () =>
          new Float32Array(double.api.getBackend() === 'cpu' ? [9, 9, 9, 9] : [0, 0, 0, 0])
      }))
    };
    const runtime = createComputeRuntime({
      tf: api,
      loadBackend: async () => null,
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => true,
      hasWebAssembly: () => false
    });

    const selection = await runtime.select('auto');

    expect(selection.backend).toBe('cpu');
    expect(selection.attempts.map((attempt) => attempt.backend)).toEqual([
      'webgpu',
      'webgl',
      'wasm'
    ]);
    expect(selection.attempts[0]?.reason).toBe(
      'the backend returned an incorrect convolution result'
    );
  });

  it('reports every attempt when no backend computes correctly', async () => {
    const {api} = tensorFlowDouble({
      conv2d: vi.fn(() => ({data: async () => new Float32Array([0, 0, 0, 0])}))
    });
    const runtime = createComputeRuntime({
      tf: api,
      loadBackend: async () => null,
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => true,
      hasWebAssembly: () => true
    });

    await expect(runtime.select('auto')).rejects.toBeInstanceOf(
      ComputeBackendUnavailableError
    );
    expect(runtime.getSelection()).toBeNull();
  });

  it('re-negotiates when something else moved the active backend', async () => {
    const double = tensorFlowDouble();
    const runtime = createComputeRuntime({
      tf: double.api,
      loadBackend: async () => null,
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => true,
      hasWebAssembly: () => true
    });

    await runtime.select('webgl');
    expect(double.api.setBackend).toHaveBeenCalledTimes(1);
    await runtime.select('webgl');
    expect(double.api.setBackend).toHaveBeenCalledTimes(1);

    double.setActive('cpu');
    await runtime.select('webgl');
    expect(double.api.setBackend).toHaveBeenCalledTimes(2);
  });

  it('serializes concurrent selections so two modes cannot interleave', async () => {
    const order: string[] = [];
    const {api} = tensorFlowDouble({
      setBackend: vi.fn(async (name: string) => {
        order.push(`start:${name}`);
        await Promise.resolve();
        order.push(`done:${name}`);
        return true;
      })
    });
    let activeBackend = 'cpu';
    const runtime = createComputeRuntime({
      tf: {
        ...api,
        getBackend: () => activeBackend,
        setBackend: async (name: string) => {
          const accepted = await api.setBackend(name);
          activeBackend = name;
          return accepted;
        }
      },
      loadBackend: async () => null,
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => true,
      hasWebAssembly: () => true
    });

    await Promise.all([runtime.select('webgl'), runtime.select('cpu')]);

    expect(order).toEqual(['start:webgl', 'done:webgl', 'start:cpu', 'done:cpu']);
  });

  it('reports which modes this browser can provide', () => {
    const {api} = tensorFlowDouble();
    const runtime = createComputeRuntime({
      tf: api,
      loadBackend: async () => null,
      wasmAssetBase: () => 'https://example.test/dist/wasm/',
      hasWebGPU: () => false,
      hasWebAssembly: () => true
    });

    expect(runtime.isBackendSupported('auto')).toBe(true);
    expect(runtime.isBackendSupported('webgpu')).toBe(false);
    expect(runtime.isBackendSupported('wasm')).toBe(true);
    expect(runtime.isBackendSupported('webgl')).toBe(true);
    expect(runtime.modes).toEqual(COMPUTE_MODES);
  });
});
