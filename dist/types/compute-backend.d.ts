/**
 * Compute backend negotiation for the reviewed TensorFlow.js runtime.
 *
 * TensorFlow.js binds every tensor to the backend that was active when the
 * tensor was created, so the backend has to be settled before a Teachable
 * Machine model is loaded. This module keeps the ordering and fallback rules
 * free of any TensorFlow.js or DOM dependency so they stay testable.
 */
export declare const COMPUTE_MODES: readonly ["auto", "webgpu", "webgl", "wasm", "cpu"];
export type ComputeMode = (typeof COMPUTE_MODES)[number];
export type ComputeBackendName = Exclude<ComputeMode, 'auto'>;
/**
 * WebGPU runs the Teachable Machine graph with the lowest per-operation
 * overhead where it is available, WebGL covers the browsers that have no
 * WebGPU adapter, the WASM SIMD build stays fast where neither GPU API is
 * usable, and the plain CPU kernels keep recognition working everywhere else.
 */
export declare const AUTO_COMPUTE_BACKEND_ORDER: ReadonlyArray<ComputeBackendName>;
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
export declare class ComputeBackendUnavailableError extends Error {
    readonly code = "TM-COMPUTE-UNAVAILABLE";
    readonly mode: ComputeMode;
    readonly attempts: ReadonlyArray<ComputeBackendAttempt>;
    constructor(mode: ComputeMode, attempts: ReadonlyArray<ComputeBackendAttempt>);
}
export declare function isComputeMode(value: unknown): value is ComputeMode;
export declare function normalizeComputeMode(value: unknown, fallback?: ComputeMode): ComputeMode;
export declare function requireComputeMode(value: unknown): ComputeMode;
/**
 * `auto` walks the standard order. A named backend is tried first and then
 * falls back through the same order, so one unusable driver cannot stop a
 * project from recognizing anything at all.
 */
export declare function computeBackendCandidates(mode: ComputeMode, order?: ReadonlyArray<ComputeBackendName>): ReadonlyArray<ComputeBackendName>;
export declare function selectComputeBackend(activation: ComputeBackendActivation, mode?: ComputeMode, order?: ReadonlyArray<ComputeBackendName>): Promise<ComputeBackendSelection>;
