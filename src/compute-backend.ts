/**
 * Compute backend negotiation for the reviewed TensorFlow.js runtime.
 *
 * TensorFlow.js binds every tensor to the backend that was active when the
 * tensor was created, so the backend has to be settled before a Teachable
 * Machine model is loaded. This module keeps the ordering and fallback rules
 * free of any TensorFlow.js or DOM dependency so they stay testable.
 */

export const COMPUTE_MODES = ['auto', 'webgpu', 'webgl', 'wasm', 'cpu'] as const;

export type ComputeMode = (typeof COMPUTE_MODES)[number];

export type ComputeBackendName = Exclude<ComputeMode, 'auto'>;

/**
 * WebGPU runs the Teachable Machine graph with the lowest per-operation
 * overhead where it is available, WebGL covers the browsers that have no
 * WebGPU adapter, the WASM SIMD build stays fast where neither GPU API is
 * usable, and the plain CPU kernels keep recognition working everywhere else.
 */
export const AUTO_COMPUTE_BACKEND_ORDER: ReadonlyArray<ComputeBackendName> = Object.freeze([
  'webgpu',
  'webgl',
  'wasm',
  'cpu'
]);

const COMPUTE_MODE_ALIASES: Readonly<Record<string, ComputeMode>> = Object.freeze({
  auto: 'auto',
  automatic: 'auto',
  default: 'auto',
  fastest: 'auto',
  自動: 'auto',
  おまかせ: 'auto',
  webgpu: 'webgpu',
  gpu: 'webgpu',
  webgl: 'webgl',
  wasm: 'wasm',
  webassembly: 'wasm',
  simd: 'wasm',
  cpu: 'cpu',
  javascript: 'cpu'
});

export interface ComputeBackendAttempt {
  readonly backend: ComputeBackendName;
  readonly reason: string;
}

export interface ComputeBackendSelection {
  readonly mode: ComputeMode;
  readonly backend: ComputeBackendName;
  /** The backend the caller named, or `null` when the caller asked for `auto`. */
  readonly requested: ComputeBackendName | null;
  /** True when the named backend was unusable and another one took over. */
  readonly fallback: boolean;
  readonly attempts: ReadonlyArray<ComputeBackendAttempt>;
}

/**
 * The steps a backend has to survive before TurboWarp TM loads a model onto it.
 * `verify` runs a real convolution because an adapter can be present and a
 * backend can register while its shader compilation still fails on the device.
 */
export interface ComputeBackendActivation {
  isSupported(backend: ComputeBackendName): boolean | Promise<boolean>;
  prepare(backend: ComputeBackendName): void | Promise<void>;
  activate(backend: ComputeBackendName): boolean | Promise<boolean>;
  verify(backend: ComputeBackendName): void | Promise<void>;
}

export class ComputeBackendUnavailableError extends Error {
  readonly code = 'TM-COMPUTE-UNAVAILABLE';
  readonly mode: ComputeMode;
  readonly attempts: ReadonlyArray<ComputeBackendAttempt>;

  constructor(mode: ComputeMode, attempts: ReadonlyArray<ComputeBackendAttempt>) {
    const detail = attempts.map((attempt) => `${attempt.backend}: ${attempt.reason}`).join('; ');
    super(`TM: No compute backend accepted mode "${mode}". ${detail}`);
    this.name = 'ComputeBackendUnavailableError';
    this.mode = mode;
    this.attempts = Object.freeze([...attempts]);
  }
}

export function isComputeMode(value: unknown): value is ComputeMode {
  return typeof value === 'string' && (COMPUTE_MODES as ReadonlyArray<string>).includes(value);
}

export function normalizeComputeMode(value: unknown, fallback: ComputeMode = 'auto'): ComputeMode {
  const text = String(value ?? '').trim().toLowerCase();
  if (text === '') return fallback;
  return COMPUTE_MODE_ALIASES[text] ?? fallback;
}

export function requireComputeMode(value: unknown): ComputeMode {
  const text = String(value ?? '').trim().toLowerCase();
  const mode = text === '' ? undefined : COMPUTE_MODE_ALIASES[text];
  if (!mode) {
    throw new TypeError(`TM: Unknown compute mode: ${String(value)}`);
  }
  return mode;
}

/**
 * `auto` walks the standard order. A named backend is tried first and then
 * falls back through the same order, so one unusable driver cannot stop a
 * project from recognizing anything at all.
 */
export function computeBackendCandidates(
  mode: ComputeMode,
  order: ReadonlyArray<ComputeBackendName> = AUTO_COMPUTE_BACKEND_ORDER
): ReadonlyArray<ComputeBackendName> {
  if (mode === 'auto') return Object.freeze([...order]);
  return Object.freeze([mode, ...order.filter((backend) => backend !== mode)]);
}

function failureReason(error: unknown): string {
  const message = (error as {message?: unknown})?.message;
  const text = String(message ?? error ?? '').trim();
  return text === '' ? 'activation failed' : text;
}

export async function selectComputeBackend(
  activation: ComputeBackendActivation,
  mode: ComputeMode = 'auto',
  order: ReadonlyArray<ComputeBackendName> = AUTO_COMPUTE_BACKEND_ORDER
): Promise<ComputeBackendSelection> {
  const requested = mode === 'auto' ? null : mode;
  const attempts: ComputeBackendAttempt[] = [];

  for (const backend of computeBackendCandidates(mode, order)) {
    try {
      if (!(await activation.isSupported(backend))) {
        attempts.push({backend, reason: 'not supported by this browser'});
        continue;
      }
      await activation.prepare(backend);
      if (!(await activation.activate(backend))) {
        throw new Error('TensorFlow.js did not switch to this backend');
      }
      await activation.verify(backend);
      return Object.freeze({
        mode,
        backend,
        requested,
        fallback: requested !== null && requested !== backend,
        attempts: Object.freeze([...attempts])
      });
    } catch (error) {
      attempts.push({backend, reason: failureReason(error)});
    }
  }

  throw new ComputeBackendUnavailableError(mode, attempts);
}
