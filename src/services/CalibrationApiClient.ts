import { DiagonalFeatures } from '@utils/detectionUtils';

/**
 * Base URL of the local calibration API (services/CalibrationApi) - a dev-
 * only tool run manually alongside the Expo dev server (`dotnet run` from
 * that project), never deployed anywhere. Not read from settings/env
 * config since there's exactly one place this ever points: the developer's
 * own machine while actively calibrating.
 */
const CALIBRATION_API_BASE_URL = 'http://localhost:5299';

/**
 * One (photo, threshold-combination) evaluation to upload for training.
 * Field names/order must match the calibration API's CalibrationSampleRecord
 * (services/CalibrationApi/Models/CalibrationSampleRecord.cs) exactly -
 * nothing enforces this across the language boundary except convention.
 */
export type CalibrationUploadRecord = DiagonalFeatures & {
  cannySigma: number;
  approxEpsilonFraction: number;
  iou: number;
  sampleId: string;
};

/** A single threshold combination, as returned by the training endpoint. */
export type ThresholdCombination = {
  cannySigma: number;
  approxEpsilonFraction: number;
};

/**
 * One decision tree from a trained FastTree ensemble, in a form with no
 * dependency on ML.NET - see the calibration API's ExportedTree/
 * TreeEnsembleExporter for exactly what these arrays mean and how to walk
 * them (see @utils/treeEnsembleUtils's evaluateTree for the client-side
 * implementation of that walk).
 */
export type ExportedTree = {
  leftChild: number[];
  rightChild: number[];
  splitFeatureIndexes: number[];
  splitThresholds: number[];
  leafValues: number[];
};

/**
 * A full trained FastTree regression model, portable outside .NET - see
 * the calibration API's ExportedTreeEnsemble for what each field means.
 */
export type ExportedTreeEnsemble = {
  trees: ExportedTree[];
  treeWeights: number[];
  bias: number;
  featureOrder: string[];
};

/**
 * One real (input, output) pair computed by the calibration API's own
 * ML.NET model, for a client to replay through its own tree-walking code
 * (see @utils/treeEnsembleUtils's verifyTreeEnsemble) and confirm it
 * reproduces the same prediction before ever trusting an ExportedTreeEnsemble.
 */
export type VerificationVector = {
  features: number[];
  expectedIou: number;
};

/**
 * Result of a training run - see the calibration API's TrainingResult for
 * what each field means. Mirrors it field-for-field (camelCase here vs
 * PascalCase there, per each language's convention, but ASP.NET Core's
 * default JSON serialization already lowercases the first letter).
 */
export type TrainingResult = {
  bestThresholds: ThresholdCombination;
  predictedAverageIoU: number;
  modelRSquared: number;
  modelRootMeanSquaredError: number;
  sampleRecordCount: number;
  distinctPhotoCount: number;
  candidateCombinationsSearched: number;
  exportedModel: ExportedTreeEnsemble;
  verificationVectors: VerificationVector[];
};

/**
 * Uploads a batch of (photo feature vector, threshold combination, IoU)
 * records to the calibration API for training - see CalibrationUploadRecord.
 * Never sends image bytes, only these numbers (see CalibrationApiClient's
 * module docs and the calibration API's own docs for why).
 *
 * @param records - The records to upload
 * @returns The API's total stored record count after this upload
 */
export const uploadCalibrationRecords = async (
  records: CalibrationUploadRecord[]
): Promise<number> => {
  const response = await fetch(
    `${CALIBRATION_API_BASE_URL}/api/calibration/samples`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(records),
    }
  );

  if (!response.ok) {
    throw new Error(
      `Calibration API upload failed: ${response.status} ${await response.text()}`
    );
  }

  const { recordCount } = (await response.json()) as { recordCount: number };
  return recordCount;
};

/**
 * Triggers a training run against every record the calibration API has
 * stored so far (across all uploads, not just the most recent one), and
 * returns its recommendation. See the calibration API's CalibrationTrainer
 * for what actually happens server-side.
 *
 * @returns The training run's result
 */
export const trainCalibrationModel = async (): Promise<TrainingResult> => {
  const response = await fetch(
    `${CALIBRATION_API_BASE_URL}/api/calibration/train`,
    { method: 'POST' }
  );

  if (!response.ok) {
    throw new Error(
      `Calibration API training failed: ${response.status} ${await response.text()}`
    );
  }

  return (await response.json()) as TrainingResult;
};
