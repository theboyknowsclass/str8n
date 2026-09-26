namespace CalibrationApi.Models;

/// <summary>
/// One decision tree from a trained FastTree ensemble, in a form with no
/// dependency on ML.NET's own types - every array is indexed by node id,
/// mirroring ML.NET's own RegressionTree representation exactly (see
/// TreeEnsembleExporter's docs for the encoding a client needs to walk
/// this: which values mean "go to another internal node" vs "this is a
/// leaf, use LeafValues at this index").
/// </summary>
public record ExportedTree(
    int[] LeftChild,
    int[] RightChild,
    int[] SplitFeatureIndexes,
    float[] SplitThresholds,
    double[] LeafValues
);

/// <summary>
/// A full trained FastTree regression model, portable to any language: sum
/// every tree's contribution (see TreeEnsembleExporter's docs for exactly
/// how) plus Bias, to reproduce the same prediction ML.NET's own
/// PredictionEngine gives for this exact model. FeatureOrder records which
/// input column each index in a tree's SplitFeatureIndexes refers to, so a
/// client can build its feature vector in a matching order regardless of
/// how CalibrationSampleRecord's properties happen to be declared -
/// verified, not just documented, since VerificationVectors exists
/// precisely so a client can confirm it built this order correctly (and
/// that it walked the trees correctly at all) before ever trusting this
/// model's predictions.
/// </summary>
public record ExportedTreeEnsemble(
    List<ExportedTree> Trees,
    double[] TreeWeights,
    double Bias,
    string[] FeatureOrder
);

/// <summary>
/// One real (input, output) pair computed by the server's own
/// PredictionEngine for the exact model an ExportedTreeEnsemble
/// represents - ground truth a client can replay through its own
/// tree-walking code to confirm it reproduces the same prediction before
/// trusting the exported model for anything. This is the actual safety
/// net for porting a model's internal structure across languages: an
/// encoding mistake (or a future ML.NET version changing that internal
/// structure) fails loudly here instead of silently producing wrong
/// predictions.
/// </summary>
public record VerificationVector(float[] Features, float ExpectedIou);
