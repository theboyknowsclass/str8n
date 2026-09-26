import { ExportedTreeEnsemble } from '@services/CalibrationApiClient';

/**
 * Settings that are persisted across app sessions
 * @property cropToOverlay - Whether to automatically crop the transformed image to fit the overlay boundaries
 * @property maintainExifMetadata - Whether to preserve EXIF metadata (date, location, camera info, etc.) when transforming images
 * @property alwaysShowInstructions - Whether to always display instruction text to guide users on how to use the app
 * @property showZoomView - Whether to show the zoom view
 * @property cannySigma - Canny edge-detection sensitivity parameter (see DetectionService)
 * @property approxEpsilonFraction - approxPolyDP simplification aggressiveness, as a fraction of contour perimeter (see DetectionService)
 * @property learnedThresholdModel - A calibration-API-trained model for
 * picking per-photo thresholds from a photo's own features (see
 * @utils/treeEnsembleUtils's predictThresholdsFromFeatures), applied via
 * the Calibration screen's "Apply learned model to this device" action.
 * Only ever set after passing verifyTreeEnsemble - see that function's
 * docs. Undefined/null means "no learned model applied", in which case
 * detection falls back to cannySigma/approxEpsilonFraction above.
 * @property shadowRemovalEnabled - Internal/dev-only toggle for the
 * illumination-normalization preprocessing step (see
 * computeShadowRemovalKernelSize and DetectionService's use of it), which
 * exists purely to make edge/contour detection more reliable on photos
 * with a shadow crossing the frame - it never changes the transformed
 * output image. Off by default: there's no calibration data yet showing
 * it actually helps, so it isn't part of the default detection pipeline
 * until it's been tested against real photos.
 * @property lineSegmentDetectionEnabled - Internal/dev-only toggle for an
 * alternate, line-segment-based detection strategy (HoughLinesP + robust
 * line fitting, instead of contour tracing) - see DetectionService's
 * detectQuadViaLineSegments. Exists to A/B this strategy against the
 * default contour-based one on the same real photos; off by default for
 * the same reason shadowRemovalEnabled is.
 */
export type PersistedSettings = {
  cropToOverlay: boolean;
  maintainExifMetadata: boolean;
  alwaysShowInstructions: boolean;
  showZoomView: boolean;
  cannySigma: number;
  approxEpsilonFraction: number;
  learnedThresholdModel?: ExportedTreeEnsemble | null;
  shadowRemovalEnabled: boolean;
  lineSegmentDetectionEnabled: boolean;
};
