import {
  ExportedTree,
  ExportedTreeEnsemble,
  VerificationVector,
} from '@services/CalibrationApiClient';
import { DetectionThresholds, DiagonalFeatures } from './detectionUtils';

/**
 * Largest acceptable gap between a locally-evaluated prediction and the
 * server's own ML.NET-computed one for the same input, in verifyTreeEnsemble.
 * Not zero: the server's numbers were computed in 32-bit float (ML.NET's
 * FastTree operates on floats throughout), while this file's arithmetic runs
 * in JS's 64-bit doubles - a real, expected rounding gap, not a sign of a
 * wrong implementation. Wide enough to absorb that, tight enough that a
 * genuine bug (wrong leaf-encoding sign, wrong feature order, etc.) still
 * fails loudly rather than passing by accident.
 */
const VERIFICATION_TOLERANCE = 1e-3;

/**
 * Walks one tree from an ExportedTreeEnsemble for a given feature vector and
 * returns its leaf value - see the calibration API's TreeEnsembleExporter
 * for the exact encoding this mirrors: starting at node 0 (the root), a
 * non-negative leftChild/rightChild entry is another internal node to
 * descend into; a negative entry encodes a leaf, whose index into
 * leafValues is that value's bitwise complement (`~v`). At each internal
 * node, the feature at splitFeatureIndexes[node] decides which child to
 * follow: at or below splitThresholds[node] goes left, above goes right -
 * the same convention ML.NET's own FastTree scorer uses.
 */
export const evaluateTree = (
  tree: ExportedTree,
  featureVector: number[]
): number => {
  let node = 0;
  while (node >= 0) {
    const featureValue = featureVector[tree.splitFeatureIndexes[node]];
    const goLeft = featureValue <= tree.splitThresholds[node];
    node = goLeft ? tree.leftChild[node] : tree.rightChild[node];
  }
  const leafIndex = ~node;
  return tree.leafValues[leafIndex];
};

/**
 * Evaluates a full ExportedTreeEnsemble for a given feature vector - the
 * on-device equivalent of asking ML.NET's own PredictionEngine for a
 * prediction from the exact model this ensemble was exported from (see
 * verifyTreeEnsemble for how to confirm that equivalence actually holds
 * before trusting this for anything).
 */
export const evaluateTreeEnsemble = (
  ensemble: ExportedTreeEnsemble,
  featureVector: number[]
): number =>
  ensemble.trees.reduce(
    (total, tree, index) =>
      total + ensemble.treeWeights[index] * evaluateTree(tree, featureVector),
    ensemble.bias
  );

/**
 * Confirms this file's tree-walking code reproduces the calibration API's
 * own ML.NET predictions for the same trained model, using the real
 * (input, output) pairs the API computed and shipped alongside the model
 * (see ExportedTreeEnsemble's/VerificationVector's docs on why this exists
 * at all: a wrong assumption anywhere in evaluateTree - the leaf-encoding
 * sign, the split direction, the feature order - would otherwise fail
 * silently, producing plausible-looking but wrong detection thresholds
 * rather than an obvious error).
 *
 * @returns true if every vector matches within VERIFICATION_TOLERANCE -
 * an ExportedTreeEnsemble that fails this should never be applied
 */
export const verifyTreeEnsemble = (
  ensemble: ExportedTreeEnsemble,
  verificationVectors: VerificationVector[]
): boolean =>
  verificationVectors.every(
    (vector) =>
      Math.abs(
        evaluateTreeEnsemble(ensemble, vector.features) - vector.expectedIou
      ) <= VERIFICATION_TOLERANCE
  );

/**
 * Builds a photo's feature vector in ExportedTreeEnsemble.featureOrder's
 * order (see CalibrationTrainer's FeatureColumns docs on the server side -
 * this must stay in sync with it), appending the candidate threshold pair
 * as the final two entries.
 */
const buildFeatureVector = (
  features: DiagonalFeatures,
  cannySigma: number,
  approxEpsilonFraction: number
): number[] => [
  features.ray0JumpMagnitude,
  features.ray0JumpLocation,
  features.ray1JumpMagnitude,
  features.ray1JumpLocation,
  features.ray2JumpMagnitude,
  features.ray2JumpLocation,
  features.ray3JumpMagnitude,
  features.ray3JumpLocation,
  features.aspectRatio,
  features.meanIntensity,
  features.intensityStdDev,
  cannySigma,
  approxEpsilonFraction,
];

/**
 * Uses a verified ExportedTreeEnsemble to pick the threshold combination
 * predicted to score best for this specific photo's own features, out of a
 * small candidate grid - the actual "learned mapping" this model enables:
 * unlike DEFAULT_CANNY_SIGMA/DEFAULT_APPROX_EPSILON_FRACTION (one fixed
 * pair for every photo) or computeAdaptiveCannySigma (a hand-derived
 * heuristic), this picks per-photo thresholds from what training on real
 * ground-truth photos actually found to work.
 *
 * Callers are responsible for only ever passing an ensemble that already
 * passed verifyTreeEnsemble - this function trusts its input completely
 * and does no verification of its own.
 */
export const predictThresholdsFromFeatures = (
  ensemble: ExportedTreeEnsemble,
  features: DiagonalFeatures,
  cannySigmaCandidates: number[],
  approxEpsilonFractionCandidates: number[]
): DetectionThresholds => {
  let best: DetectionThresholds = {
    cannySigma: cannySigmaCandidates[0],
    approxEpsilonFraction: approxEpsilonFractionCandidates[0],
  };
  let bestPredictedIoU = -Infinity;

  for (const cannySigma of cannySigmaCandidates) {
    for (const approxEpsilonFraction of approxEpsilonFractionCandidates) {
      const predictedIoU = evaluateTreeEnsemble(
        ensemble,
        buildFeatureVector(features, cannySigma, approxEpsilonFraction)
      );
      if (predictedIoU > bestPredictedIoU) {
        bestPredictedIoU = predictedIoU;
        best = { cannySigma, approxEpsilonFraction };
      }
    }
  }

  return best;
};
