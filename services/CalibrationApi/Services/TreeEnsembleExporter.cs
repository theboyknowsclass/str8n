using CalibrationApi.Models;
using Microsoft.ML.Trainers.FastTree;

namespace CalibrationApi.Services;

/// <summary>
/// Converts a trained ML.NET FastTree regression model into a plain,
/// language-agnostic ExportedTreeEnsemble - the actual mechanism behind
/// "port the trained model to run on-device" (see CalibrationTrainer's
/// docs on why FastTree specifically, rather than whatever model type
/// AutoML happens to pick, is what gets trained and exported here).
///
/// Encoding a client needs to know to walk a tree correctly, verified
/// against ML.NET's real source (Microsoft.ML.Trainers.FastTree.RegressionTree)
/// rather than assumed: for internal node i, LeftChild[i]/RightChild[i]
/// holds either a non-negative index of another internal node to descend
/// into, or a negative value encoding a leaf - the leaf's index into
/// LeafValues is the bitwise complement of that value (`~v`, equivalently
/// `-v - 1`). The root is always node 0. A tree's own prediction for a
/// feature vector is whatever LeafValues entry the walk ends on; the
/// ensemble's prediction is the weighted sum of every tree's contribution
/// (`TreeWeights[t] * treeValue(t)`) plus Bias - this exact shape is why
/// CalibrationTrainer includes VerificationVectors with every export, so
/// a client can confirm its own implementation of this walk (and this
/// encoding) reproduces the same numbers as ML.NET's own PredictionEngine
/// before trusting it for anything.
/// </summary>
public static class TreeEnsembleExporter
{
    public static ExportedTreeEnsemble Export(
        FastTreeRegressionModelParameters modelParameters,
        string[] featureOrder
    )
    {
        var ensemble = modelParameters.TrainedTreeEnsemble;
        var trees = ensemble.Trees
            .Select(tree => new ExportedTree(
                LeftChild: tree.LeftChild.ToArray(),
                RightChild: tree.RightChild.ToArray(),
                SplitFeatureIndexes: tree.NumericalSplitFeatureIndexes.ToArray(),
                SplitThresholds: tree.NumericalSplitThresholds.ToArray(),
                LeafValues: tree.LeafValues.ToArray()
            ))
            .ToList();

        return new ExportedTreeEnsemble(
            Trees: trees,
            TreeWeights: ensemble.TreeWeights.ToArray(),
            Bias: ensemble.Bias,
            FeatureOrder: featureOrder
        );
    }
}
