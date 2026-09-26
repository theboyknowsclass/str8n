namespace CalibrationApi.Models;

/// <summary>
/// A single threshold combination, as shipped to the client and ultimately
/// hand-copied into detectionUtils.ts's DEFAULT_* constants - the model's
/// output is never applied automatically (see CalibrationTrainer's docs).
/// </summary>
public record ThresholdCombination(float CannySigma, float ApproxEpsilonFraction);

/// <summary>
/// Result of a training run: the best combination the surrogate-model
/// search found, how well the surrogate model itself is trusted to
/// predict IoU (cross-validated, not the same thing as the recommended
/// combination's own predicted score), how much data went into it, and
/// the trained model itself - ported to a form usable outside .NET (see
/// TreeEnsembleExporter) plus the ground-truth vectors a client should
/// check its own tree-walking code against before trusting it (see
/// ExportedTreeEnsemble's docs on why - CalibrationTrainer never applies
/// ExportedModel automatically, same as BestThresholds).
/// </summary>
public record TrainingResult(
    ThresholdCombination BestThresholds,
    float PredictedAverageIoU,
    float ModelRSquared,
    float ModelRootMeanSquaredError,
    int SampleRecordCount,
    int DistinctPhotoCount,
    int CandidateCombinationsSearched,
    ExportedTreeEnsemble ExportedModel,
    List<VerificationVector> VerificationVectors
);
