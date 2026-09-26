import shippedModelJson from '@assets/learnedThresholdModel.json';
import {
  ExportedTreeEnsemble,
  VerificationVector,
} from '@services/CalibrationApiClient';
import { verifyTreeEnsemble } from './treeEnsembleUtils';

/**
 * The shape committed to @assets/learnedThresholdModel.json - the same
 * (exportedModel, verificationVectors) pair the calibration API's
 * TrainingResult returns, bundled together rather than as a bare
 * ExportedTreeEnsemble so this file can verify itself (see
 * SHIPPED_LEARNED_THRESHOLD_MODEL's docs) the same way the Calibration
 * screen's "Apply learned model to this device" action does. `null` means
 * nothing has been trained and committed yet.
 */
type ShippedLearnedThresholdModel = {
  exportedModel: ExportedTreeEnsemble;
  verificationVectors: VerificationVector[];
} | null;

// A plain JSON import (resolveJsonModule, already enabled via
// expo/tsconfig.base) so Metro bundles this file's contents directly
// rather than needing any runtime file-system access - works identically
// on web and native. Cast rather than inferred: the placeholder committed
// value is a bare `null` literal, which TypeScript would otherwise narrow
// to the type `null` alone rather than this broader union.
const rawShippedModel = shippedModelJson as ShippedLearnedThresholdModel;

/**
 * The learned threshold model committed to the repo and shipped to every
 * install of the app, for both DetectionService.ts (web) and
 * DetectionService.native.ts to use identically - see
 * predictThresholdsFromFeatures's docs for what it actually changes about
 * detection. Update it by pasting a fresh export from the Calibration
 * screen's "Copy learned model JSON" action over
 * @assets/learnedThresholdModel.json and committing that change, the same
 * hand-verify-then-commit workflow DEFAULT_CANNY_SIGMA/
 * DEFAULT_APPROX_EPSILON_FRACTION already use.
 *
 * Verified once here, at import time, against its own bundled verification
 * vectors (see verifyTreeEnsemble's docs on why) - null both when nothing
 * has been trained and committed yet, and if a corrupted commit somehow
 * got past review and fails its own verification, so a broken file here
 * degrades every install to the existing heuristic instead of silently
 * shipping wrong thresholds.
 */
export const SHIPPED_LEARNED_THRESHOLD_MODEL: ExportedTreeEnsemble | null =
  (() => {
    if (!rawShippedModel) {
      return null;
    }
    const isValid = verifyTreeEnsemble(
      rawShippedModel.exportedModel,
      rawShippedModel.verificationVectors
    );
    if (!isValid) {
      console.error(
        'The committed learnedThresholdModel.json failed its own verification vectors - falling back to the detection heuristic. Re-export it from the Calibration screen.'
      );
      return null;
    }
    return rawShippedModel.exportedModel;
  })();
