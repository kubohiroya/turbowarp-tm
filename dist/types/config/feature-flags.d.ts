export declare const FEATURE_FLAGS: {
    /**
     * Per-frame confidence flickers near a decision boundary, so the accumulated
     * score blocks — which integrate confidence over time and decay it — are the
     * built-in answer to a noisy recognition result. They are on by default; the
     * event bridge that republishes those changes to other extensions is not.
     */
    readonly temporalPoseScoring: true;
    readonly accumulatedPoseEvents: false;
    readonly poseOverlay: true;
};
export type FeatureFlags = Record<keyof typeof FEATURE_FLAGS, boolean>;
