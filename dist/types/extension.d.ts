import { type ComputeBackendSelection, type ComputeMode } from './compute-backend.js';
import { type FeatureFlags } from './config/feature-flags.js';
import { type PoseOverlayConfidenceProperty } from './pose-overlay.js';
export declare const EXTENSION_ID = "kubohiroyatm";
export declare const VERSION: string;
export declare const DOCS_URI = "https://kubohiroya.github.io/turbowarp-teachable-machine/";
export declare const ACCUMULATED_POSE_CHANGED_EVENT = "TM_ACCUMULATED_POSE_CHANGED";
/** The readback canvas size every downstream frame reader is written against. */
export declare const CAMERA_FRAME_WIDTH = 320;
export declare const CAMERA_FRAME_HEIGHT = 240;
export declare const BLOCK_ICON_URI: string;
export type RecognitionMode = 'pose' | 'image' | 'audio';
export interface TeachableMachineRuntime {
    Webcam: new (width: number, height: number, flipHorizontal: boolean) => any;
    load?(modelURL: string, metadataURL: string): Promise<any>;
    loadFromFiles?(model: File, weights: File, metadata: File): Promise<any>;
}
export interface TeachableMachineAudioRuntime {
    load(modelURL: string, metadataURL: string): Promise<any>;
}
export type TMRuntime = TeachableMachineRuntime;
/**
 * The compute-backend control surface published by the reviewed browser runtime
 * as `globalThis.tmCompute`. Hosts that preload their own runtime can inject an
 * equivalent object instead.
 */
export interface TMComputeController {
    select(mode?: unknown): Promise<ComputeBackendSelection>;
    getSelection(): ComputeBackendSelection | null;
    getBackend(): string;
}
export interface TMExtensionDependencies {
    runtime?: TeachableMachineRuntime;
    poseRuntime?: TeachableMachineRuntime;
    imageRuntime?: TeachableMachineRuntime;
    audioRuntime?: TeachableMachineAudioRuntime;
    compute?: TMComputeController;
    computeMode?: ComputeMode;
    allowRemoteLibraries?: boolean;
    onAccumulatedPoseChanged?: (event: AccumulatedPoseChangedEventV2) => void;
}
export interface AccumulatedPoseChangedEventV2 {
    version: 2;
    poseName: string;
    previousPoseName: string;
    score: number;
    reason: 'recognition' | 'reset' | 'stop';
    timestamp: number;
}
export declare const BROWSER_RUNTIME_URL: string;
export declare function loadScript(src: string): Promise<void>;
/**
 * Initialize the camera canvas before Teachable Machine or TensorFlow.js requests its context.
 * The camera path is independent of the selected compute mode: whichever backend recognition runs
 * on, TM intentionally uses the browser's normal Canvas2D context here. Its one-draw/one-read
 * camera path does not demonstrate a repeatable end-to-end benefit from forcing a
 * readback-optimized context, and the legacy backend parameter remains accepted for compatibility.
 */
export declare function initializeCameraReadbackContext(canvas: unknown, _tensorflowBackend?: string | null): CanvasRenderingContext2D;
export declare class TMExtension {
    [key: string]: any;
    constructor(featureFlags?: Partial<FeatureFlags>, dependencies?: TMExtensionDependencies);
    getInfo(): {
        id: string;
        name: any;
        docsURI: string;
        blockIconURI: string;
        blocks: {
            arguments?: {
                [k: string]: {
                    menu?: any;
                    type: any;
                    defaultValue: any;
                };
            };
            disableMonitor?: boolean;
            opcode: any;
            blockType: any;
            text: any;
        }[];
        menus: {
            positionMenu: {
                acceptReporters: boolean;
                items: {
                    text: any;
                    value: string;
                }[];
            };
            previewMirroringMenu: {
                acceptReporters: boolean;
                items: {
                    text: any;
                    value: string;
                }[];
            };
            recognitionModeMenu: {
                acceptReporters: boolean;
                items: {
                    text: any;
                    value: RecognitionMode;
                }[];
            };
            computeModeMenu: {
                acceptReporters: boolean;
                items: {
                    text: any;
                    value: "auto" | "webgpu" | "webgl" | "wasm" | "cpu";
                }[];
            };
            poseOverlayVisibilityMenu: {
                acceptReporters: boolean;
                items: {
                    text: any;
                    value: string;
                }[];
            };
            poseKeypointMenu: {
                acceptReporters: boolean;
                items: {
                    text: "nose" | "leftEye" | "rightEye" | "leftEar" | "rightEar" | "leftShoulder" | "rightShoulder" | "leftElbow" | "rightElbow" | "leftWrist" | "rightWrist" | "leftHip" | "rightHip" | "leftKnee" | "rightKnee" | "leftAnkle" | "rightAnkle";
                    value: "nose" | "leftEye" | "rightEye" | "leftEar" | "rightEar" | "leftShoulder" | "rightShoulder" | "leftElbow" | "rightElbow" | "leftWrist" | "rightWrist" | "leftHip" | "rightHip" | "leftKnee" | "rightKnee" | "leftAnkle" | "rightAnkle";
                }[];
            };
            poseConfidencePropertyMenu: {
                acceptReporters: boolean;
                items: {
                    text: any;
                    value: PoseOverlayConfidenceProperty;
                }[];
            };
            cameraMenu: {
                acceptReporters: boolean;
                items: string;
            };
        };
    };
    versionReporter(): string;
    setLastError(error: any): void;
    setRecognitionMode(args: any): void;
    recognitionModeReporter(): any;
    activeComputeRuntime(): TMComputeController | null;
    /**
     * TensorFlow.js binds every tensor to the backend that was active when the
     * tensor was created, so the backend is negotiated before any model loads. A
     * host that preloads a runtime without a compute controller keeps whatever
     * backend TensorFlow.js selected for itself.
     */
    ensureComputeBackend(): Promise<ComputeBackendSelection | null>;
    setComputeMode(args: any): Promise<void>;
    releaseOwnedModel(model: object): Promise<void>;
    computeModeReporter(): any;
    computeBackendReporter(): any;
    setModelURL(args: any): void;
    activeRuntime(): TeachableMachineRuntime | TeachableMachineAudioRuntime | null;
    ensureLibrariesLoaded(): Promise<void>;
    cleanupCameraResources(): void;
    startCamera(): Promise<void>;
    /**
     * Give the camera the readback canvas `setup()` did not build.
     *
     * Upstream creates that canvas inside the same branch that opens the camera, so an injected
     * element skips the canvas with the `getUserMedia` call. 3.4.0 shipped assuming the two were
     * separate, and every leased start then failed at the first context request with "Webcam canvas
     * does not provide a 2D context" -- which is to say pose recognition did not start at all
     * wherever Camera Source was present. The canvas built here is the one upstream would have
     * built, so the mirrored centre crop every downstream reader expects is unchanged.
     */
    ensureCameraCanvas(): void;
    /**
     * A lease on the shared camera, or null when Camera Source is not loaded.
     *
     * Camera Source owns the device and decides when a stream stops, which is what lets one camera
     * serve pose recognition and anything else reading frames at the same time. It is a separate
     * TurboWarp extension, and this one is also distributed for standalone URL loading, so its
     * absence is ordinary rather than a failure: the self-acquired path stays for it.
     *
     * One camera id for every visual recognition mode. Opening a second device for a work that
     * recognises both poses and images is not what sharing is for, and `pose` is the role name
     * Camera Source's own documentation uses for this consumer.
     */
    private acquireSharedCamera;
    stopCamera(): void;
    isCameraRunning(): any;
    getCameraMenuItems(): {
        text: any;
        value: string;
    }[];
    refreshCameraDevices(): Promise<any>;
    refreshCameraList(): Promise<void>;
    setCameraSelection(args: any): any;
    setCameraDeviceId(deviceId: any): any;
    private resolvedCameraSelection;
    private enqueueCameraSelection;
    private applyCameraSelection;
    updateActiveCameraInfo(): void;
    cameraCountReporter(): any;
    cameraDeviceIdReporter(): any;
    cameraDeviceNameReporter(): any;
    showPreview(): void;
    hidePreview(): void;
    isPreviewVisible(): any;
    setPreviewOpacity(args: any): void;
    setPreviewPosition(args: any): void;
    setPreviewMirroring(args: any): void;
    previewMirroringReporter(): "mirrored" | "unmirrored";
    setPoseOverlayVisibility(args: any): void;
    showPoseOverlay(): void;
    hidePoseOverlay(): void;
    isPoseOverlayVisible(): any;
    setPoseJointStyle(args: any): void;
    setPoseBoneStyle(args: any): void;
    setPoseOverlayMinimumConfidence(args: any): void;
    setPoseConfidenceScaling(args: any): void;
    loadModel(): Promise<void>;
    isModelLoaded(): boolean;
    usePreparedModel(model: any): void;
    clearPreparedModel(model: any): void;
    startRecognition(): Promise<void>;
    stopRecognition(): void;
    isRecognizing(): any;
    startAudioRecognition(): Promise<void>;
    stopAudioRecognition(): void;
    audioPredictionFromResult(model: any, result: any): any;
    applyPredictions(prediction: any): void;
    findStageElement(): Element;
    findLikelyStageCanvas(): HTMLCanvasElement;
    validatePreviewAttachment(stage: any, canvas: any): void;
    createSvgElement(name: string): SVGElement;
    ensurePoseOverlayElement(): SVGSVGElement | null;
    updatePoseOverlayVisibility(): void;
    clearPoseOverlay(): void;
    redrawPoseOverlay(): void;
    renderPoseOverlay(keypoints: unknown): void;
    attachPreviewToStage(): void;
    updatePreviewStyle(): void;
    startLoopIfNeeded(): void;
    private trackPreparedModelOperation;
    waitForPreparedModelIdle(model: object): Promise<void>;
    loop(generation?: any): Promise<void>;
    recognizeFrame(model: any, recognitionMode: RecognitionMode): Promise<{
        keypoints: any;
        prediction: any;
    }>;
    currentPoseReporter(): any;
    scoreReporter(): number;
    poseScoreReporter(args: any): number;
    setAccumulatedPoseParameters(args: any): void;
    setAccumulatedPoseThreshold(args: any): void;
    startAccumulatedPoseSession(now?: number): void;
    supportsAccumulatedPoseEvents(): any;
    emitAccumulatedPoseChanged(previousPoseName: string, reason: AccumulatedPoseChangedEventV2['reason']): void;
    dispose(): void;
    resetAccumulatedPose(reason?: AccumulatedPoseChangedEventV2['reason']): void;
    handleDocumentVisibilityChange(): void;
    updateAccumulatedPose(prediction: any, now?: number): void;
    updateAccumulatedPoseSelection(): void;
    accumulatedPoseReporter(): any;
    accumulatedScoreReporter(): any;
    accumulatedPoseScoreReporter(args: any): any;
    isPose(args: any): boolean;
    isPoseWithThreshold(args: any): boolean;
    cameraMsReporter(): any;
    modelLoadMsReporter(): any;
    firstRecognitionMsReporter(): any;
    lastErrorReporter(): any;
}
