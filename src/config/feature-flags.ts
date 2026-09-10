export const FEATURE_FLAGS = {
  /**
   * Per-frame confidence flickers near a decision boundary, so the accumulated
   * score blocks — which integrate confidence over time and decay it — are the
   * built-in answer to a noisy recognition result. They are on by default; the
   * event bridge that republishes those changes to other extensions is not.
   */
  temporalPoseScoring: true,
  accumulatedPoseEvents: false,
  poseOverlay: true
} as const;

export type FeatureFlags = Record<keyof typeof FEATURE_FLAGS, boolean>;
