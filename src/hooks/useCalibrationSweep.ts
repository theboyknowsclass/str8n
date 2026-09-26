import { useState } from 'react';
import {
  CalibrationUploadRecord,
  DetectionService,
  TrainingResult,
  trainCalibrationModel,
  uploadCalibrationRecords,
} from '@services';
import { useCalibrationStore } from '@stores';
import { ImageSource } from '@types';
import {
  APPROX_EPSILON_CANDIDATES,
  CANNY_SIGMA_CANDIDATES,
  DEFAULT_APPROX_EPSILON_FRACTION,
  DEFAULT_CANNY_SIGMA,
  computePolygonIoU,
} from '@utils/detectionUtils';

/**
 * One tested threshold combination's score against every saved calibration
 * sample. Area-fraction bounds aren't swept: the minimum is a fixed sanity
 * cutoff and the maximum was retired once touchesImageBorder took over its
 * one real job more precisely (see MIN_DETECTED_AREA_FRACTION's docs) -
 * cannySigma and approxEpsilonFraction are the only thresholds that
 * actually benefit from per-photo tuning.
 * @property cannySigma - The candidate Canny edge-sensitivity parameter
 * @property approxEpsilonFraction - The candidate approxPolyDP simplification aggressiveness
 * @property averageIoU - The average Intersection-over-Union across all
 * samples, from 0 (no overlap with ground truth, on average) to 1 (perfect)
 */
export type CalibrationSweepResult = {
  cannySigma: number;
  approxEpsilonFraction: number;
  averageIoU: number;
};

/**
 * Return type for the useCalibrationSweep hook.
 * @property isRunning - Whether a local sweep is currently in progress
 * @property results - The most recently completed sweep's results, sorted
 * best (highest average IoU) first
 * @property runSweep - Runs a new local sweep across all saved samples
 * @property uploadableRecordCount - How many (photo, combination) records
 * the last sweep produced that are actually usable by the calibration API -
 * only samples with a saved feature vector count (see CalibrationSample's
 * docs), so this can be lower than results.length * samples.length
 * @property isTraining - Whether an upload-and-train round trip to the
 * calibration API is currently in progress
 * @property trainingResult - The calibration API's most recent full result
 * (recommendation plus cross-validated model quality - see TrainingResult),
 * or null if training hasn't been run (or failed) yet
 * @property trainingError - The most recent upload/train failure's message,
 * or null - most likely cause is the API not running locally
 * @property uploadAndTrain - Uploads the last sweep's records to the
 * calibration API and triggers a training run
 * @property lineSegmentAverageIoU - The line-segment strategy's average
 * IoU across every saved sample (see DetectionThresholds.detectionStrategy)
 * from the same run, for a direct comparison against the contour
 * strategy's best result in `results` - null until a sweep has completed.
 * This strategy has no equivalent tunable grid to sweep (it's
 * threshold-free, Otsu-based), so it's just run once per sample rather
 * than once per combination.
 */
type UseCalibrationSweep = {
  isRunning: boolean;
  results: CalibrationSweepResult[];
  runSweep: () => Promise<void>;
  uploadableRecordCount: number;
  lineSegmentAverageIoU: number | null;
  /**
   * How many threshold combinations the sweep tests per sample - so a
   * caller can explain uploadableRecordCount as "N photos x M combinations"
   * instead of a bare, easily-misread total.
   */
  combinationsPerSample: number;
  isTraining: boolean;
  trainingResult: TrainingResult | null;
  trainingError: string | null;
  uploadAndTrain: () => Promise<void>;
};

/**
 * Hook that runs the detection pipeline against every saved calibration
 * sample for a grid of threshold combinations (Canny sensitivity and
 * approxPolyDP epsilon), scoring each combination by its average IoU
 * against the samples' hand-marked ground truth. This is a
 * developer tool (see the __DEV__-gated Calibration screen) for finding
 * good real-world default thresholds - the results inform a manual edit to
 * the DEFAULT_* constants in detectionUtils.ts, they aren't applied
 * automatically.
 *
 * Uses DetectionService.detectQuad's thresholdOverrides parameter rather
 * than writing to usePersistedSettingsStore for each candidate, so the
 * sweep never mutates the app's real settings or causes other screens
 * reading them to flicker mid-sweep.
 *
 * The same sweep pass also builds one CalibrationUploadRecord per (sample,
 * combination) pair it evaluates, for samples that have a saved feature
 * vector - this is the raw material uploadAndTrain sends to the local
 * calibration API (see services/CalibrationApi), so running a local sweep
 * is a prerequisite for training via the API, not a separate step.
 *
 * @returns UseCalibrationSweep containing the running/training state,
 * results, and the functions to run a sweep or train via the API
 *
 * @example
 * ```typescript
 * const { isRunning, results, runSweep, uploadAndTrain } = useCalibrationSweep();
 * await runSweep();
 * await uploadAndTrain();
 * ```
 */
export const useCalibrationSweep = (): UseCalibrationSweep => {
  const { samples } = useCalibrationStore();
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<CalibrationSweepResult[]>([]);
  const [uploadRecords, setUploadRecords] = useState<CalibrationUploadRecord[]>(
    []
  );
  const [isTraining, setIsTraining] = useState(false);
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(
    null
  );
  const [trainingError, setTrainingError] = useState<string | null>(null);
  const [lineSegmentAverageIoU, setLineSegmentAverageIoU] = useState<
    number | null
  >(null);

  const runSweep = async () => {
    if (samples.length === 0) {
      return;
    }

    setIsRunning(true);
    try {
      const sweepResults: CalibrationSweepResult[] = [];
      const records: CalibrationUploadRecord[] = [];

      for (const cannySigma of CANNY_SIGMA_CANDIDATES) {
        for (const approxEpsilonFraction of APPROX_EPSILON_CANDIDATES) {
          let totalIoU = 0;
          for (const sample of samples) {
            const imageSource: ImageSource = {
              uri: sample.imageUri,
              dimensions: { width: sample.width, height: sample.height },
              tags: null,
            };
            const detectedPoints = await DetectionService.detectQuad(
              imageSource,
              undefined,
              { cannySigma, approxEpsilonFraction }
            );
            const iou = computePolygonIoU(
              detectedPoints,
              sample.groundTruthPoints
            );
            totalIoU += iou;

            if (sample.features) {
              records.push({
                ...sample.features,
                cannySigma,
                approxEpsilonFraction,
                iou,
                sampleId: sample.id,
              });
            }
          }

          sweepResults.push({
            cannySigma,
            approxEpsilonFraction,
            averageIoU: totalIoU / samples.length,
          });
        }
      }

      sweepResults.sort((a, b) => b.averageIoU - a.averageIoU);
      setResults(sweepResults);
      setUploadRecords(records);

      // The line-segment strategy has no equivalent tunable grid (it's
      // threshold-free, Otsu-based) - just run once per sample rather than
      // once per combination, for a direct comparison against the contour
      // strategy's best result above.
      let lineSegmentTotalIoU = 0;
      for (const sample of samples) {
        const imageSource: ImageSource = {
          uri: sample.imageUri,
          dimensions: { width: sample.width, height: sample.height },
          tags: null,
        };
        const detectedPoints = await DetectionService.detectQuad(
          imageSource,
          undefined,
          {
            cannySigma: DEFAULT_CANNY_SIGMA,
            approxEpsilonFraction: DEFAULT_APPROX_EPSILON_FRACTION,
            detectionStrategy: 'lineSegment',
          }
        );
        lineSegmentTotalIoU += computePolygonIoU(
          detectedPoints,
          sample.groundTruthPoints
        );
      }
      setLineSegmentAverageIoU(lineSegmentTotalIoU / samples.length);
    } finally {
      setIsRunning(false);
    }
  };

  const uploadAndTrain = async () => {
    if (uploadRecords.length === 0) {
      return;
    }

    setIsTraining(true);
    setTrainingError(null);
    try {
      await uploadCalibrationRecords(uploadRecords);
      const result = await trainCalibrationModel();
      setTrainingResult(result);
    } catch (error) {
      setTrainingError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTraining(false);
    }
  };

  return {
    isRunning,
    results,
    runSweep,
    uploadableRecordCount: uploadRecords.length,
    combinationsPerSample:
      CANNY_SIGMA_CANDIDATES.length * APPROX_EPSILON_CANDIDATES.length,
    lineSegmentAverageIoU,
    isTraining,
    trainingResult,
    trainingError,
    uploadAndTrain,
  };
};
