using CalibrationApi.Models;
using Microsoft.ML;
using Microsoft.ML.Data;
using Microsoft.ML.Trainers.FastTree;

namespace CalibrationApi.Services;

/// <summary>
/// Trains a regression model that predicts IoU from a photo's diagonal
/// feature vector plus a threshold combination, then uses that trained
/// model - not the real OpenCV pipeline, which never runs here - to
/// cheaply search a much finer threshold grid than the client's own sweep
/// evaluated, across every distinct photo on file. Also exports the
/// trained model itself (see TreeEnsembleExporter) so it can eventually run
/// directly on-device, rather than only ever producing a single
/// hand-copied recommendation the way BestThresholds does.
///
/// Deliberately uses a direct FastTree trainer rather than AutoML's
/// CreateRegressionExperiment (what an earlier version of this class used):
/// AutoML can pick any regression trainer it likes, and only a tree
/// ensemble has a tractable, well-defined portable export (see
/// TreeEnsembleExporter's docs) - forcing FastTree specifically is what
/// makes ExportedModel possible at all, at the cost of no longer letting
/// AutoML search across model families. FastTree was already the
/// documented common AutoML pick for small tabular data like this, so the
/// practical difference is expected to be small.
/// </summary>
public class CalibrationTrainer
{
    /// <summary>
    /// Fixed feature-column order, shared between the training pipeline's
    /// Concatenate step and both GetFeatureVector and
    /// ExportedTreeEnsemble.FeatureOrder - a client evaluating the exported
    /// model needs to build its own feature vector in this exact order.
    /// Nothing enforces these three staying in sync except this comment
    /// (same convention already accepted for CalibrationUploadRecord's
    /// field order on the TypeScript side) - change all three together.
    /// </summary>
    private static readonly string[] FeatureColumns =
    [
        nameof(CalibrationSampleRecord.Ray0JumpMagnitude),
        nameof(CalibrationSampleRecord.Ray0JumpLocation),
        nameof(CalibrationSampleRecord.Ray1JumpMagnitude),
        nameof(CalibrationSampleRecord.Ray1JumpLocation),
        nameof(CalibrationSampleRecord.Ray2JumpMagnitude),
        nameof(CalibrationSampleRecord.Ray2JumpLocation),
        nameof(CalibrationSampleRecord.Ray3JumpMagnitude),
        nameof(CalibrationSampleRecord.Ray3JumpLocation),
        nameof(CalibrationSampleRecord.AspectRatio),
        nameof(CalibrationSampleRecord.MeanIntensity),
        nameof(CalibrationSampleRecord.IntensityStdDev),
        nameof(CalibrationSampleRecord.CannySigma),
        nameof(CalibrationSampleRecord.ApproxEpsilonFraction),
    ];

    private const int NumberOfTrees = 50;
    private const int NumberOfLeaves = 8;
    private const int MinimumExampleCountPerLeaf = 5;
    private const int CrossValidationFolds = 5;

    /// <summary>
    /// How many real (features, prediction) pairs to include as
    /// VerificationVectors - just enough for a client to be confident its
    /// tree-walking code is correct, not an exhaustive check.
    /// </summary>
    private const int VerificationVectorCount = 5;

    /// <summary>
    /// How many evenly-spaced steps to search within each dimension's
    /// observed [min, max] range (see BuildSearchGrid). FastTree - a
    /// tree-based regressor - only interpolates reliably within the range
    /// of values it was trained on; a step count finer than the client's
    /// own sweep grid still stays safely interpolative as long as the
    /// bounds themselves come from real observed data, which is the actual
    /// value of running this search at all rather than just re-reporting
    /// the client's own grid's best entry.
    /// </summary>
    private const int SearchStepsPerDimension = 12;

    public TrainingResult TrainAndRecommend(List<CalibrationSampleRecord> records)
    {
        if (records.Count == 0)
        {
            throw new InvalidOperationException(
                "Cannot train with zero calibration records - upload samples first."
            );
        }

        var mlContext = new MLContext(seed: 1);
        var dataView = mlContext.Data.LoadFromEnumerable(records);

        var pipeline = mlContext.Transforms
            .Concatenate("Features", FeatureColumns)
            .Append(
                mlContext.Regression.Trainers.FastTree(
                    labelColumnName: nameof(CalibrationSampleRecord.Iou),
                    featureColumnName: "Features",
                    numberOfLeaves: NumberOfLeaves,
                    numberOfTrees: NumberOfTrees,
                    minimumExampleCountPerLeaf: MinimumExampleCountPerLeaf
                )
            );

        // Cross-validated quality estimate from held-out folds - a
        // separate concern from the final model below, which is refit on
        // every record so the exported/deployed model uses all available
        // data rather than leaving a fold's worth unused.
        var crossValidationFolds = mlContext.Regression.CrossValidate(
            dataView,
            pipeline,
            numberOfFolds: CrossValidationFolds,
            labelColumnName: nameof(CalibrationSampleRecord.Iou)
        );
        var modelRSquared = (float)
            crossValidationFolds.Average(fold => fold.Metrics.RSquared);
        var modelRootMeanSquaredError = (float)
            crossValidationFolds.Average(fold => fold.Metrics.RootMeanSquaredError);

        var fittedModel = pipeline.Fit(dataView);
        var predictionEngine = mlContext.Model
            .CreatePredictionEngine<CalibrationSampleRecord, IoUPrediction>(fittedModel);

        var fastTreeModelParameters =
            (
                (RegressionPredictionTransformer<FastTreeRegressionModelParameters>)
                fittedModel.LastTransformer
            ).Model;
        var exportedModel = TreeEnsembleExporter.Export(fastTreeModelParameters, FeatureColumns);

        var verificationVectors = records
            .Take(VerificationVectorCount)
            .Select(record => new VerificationVector(
                Features: GetFeatureVector(record),
                ExpectedIou: predictionEngine.Predict(record).Score
            ))
            .ToList();

        var distinctPhotos = records
            .GroupBy(r => r.SampleId)
            .Select(g => g.First())
            .ToList();

        var cannySigmaGrid = BuildSearchGrid(records, r => r.CannySigma);
        var approxEpsilonFractionGrid = BuildSearchGrid(records, r => r.ApproxEpsilonFraction);

        var (bestCombination, bestAverageIoU, combinationsSearched) = SearchForBestCombination(
            predictionEngine,
            distinctPhotos,
            cannySigmaGrid,
            approxEpsilonFractionGrid
        );

        return new TrainingResult(
            BestThresholds: bestCombination,
            PredictedAverageIoU: bestAverageIoU,
            ModelRSquared: modelRSquared,
            ModelRootMeanSquaredError: modelRootMeanSquaredError,
            SampleRecordCount: records.Count,
            DistinctPhotoCount: distinctPhotos.Count,
            CandidateCombinationsSearched: combinationsSearched,
            ExportedModel: exportedModel,
            VerificationVectors: verificationVectors
        );
    }

    /// <summary>
    /// Builds a record's feature vector in FeatureColumns's exact order -
    /// see that field's docs on why this must stay in sync with it.
    /// </summary>
    private static float[] GetFeatureVector(CalibrationSampleRecord record) =>
    [
        record.Ray0JumpMagnitude,
        record.Ray0JumpLocation,
        record.Ray1JumpMagnitude,
        record.Ray1JumpLocation,
        record.Ray2JumpMagnitude,
        record.Ray2JumpLocation,
        record.Ray3JumpMagnitude,
        record.Ray3JumpLocation,
        record.AspectRatio,
        record.MeanIntensity,
        record.IntensityStdDev,
        record.CannySigma,
        record.ApproxEpsilonFraction,
    ];

    /// <summary>
    /// Builds an evenly-spaced search grid strictly within the observed
    /// [min, max] range of one column across all uploaded records. Bounding
    /// the grid to real observed values (rather than a hardcoded range) is
    /// what keeps every prediction below an interpolation, never an
    /// extrapolation - see SearchStepsPerDimension's docs. A single
    /// distinct observed value produces a single-point "grid" rather than
    /// a divide-by-zero.
    /// </summary>
    private static float[] BuildSearchGrid(
        List<CalibrationSampleRecord> records,
        Func<CalibrationSampleRecord, float> selector
    )
    {
        var min = records.Min(selector);
        var max = records.Max(selector);
        if (max <= min)
        {
            return [min];
        }

        return Enumerable
            .Range(0, SearchStepsPerDimension)
            .Select(i => min + (max - min) * i / (SearchStepsPerDimension - 1))
            .ToArray();
    }

    /// <summary>
    /// Evaluates every candidate combination from the observed-range search
    /// grids against every distinct photo's feature vector using the
    /// trained surrogate model, and returns whichever combination scores
    /// highest on average - this is the whole reason to have trained a
    /// model at all, rather than just reporting the best combination the
    /// client's own grid already found.
    /// </summary>
    private static (ThresholdCombination Combination, float AverageIoU, int CombinationsSearched)
        SearchForBestCombination(
            PredictionEngine<CalibrationSampleRecord, IoUPrediction> predictionEngine,
            List<CalibrationSampleRecord> distinctPhotos,
            float[] cannySigmaGrid,
            float[] approxEpsilonFractionGrid
        )
    {
        ThresholdCombination? bestCombination = null;
        var bestAverageIoU = float.NegativeInfinity;
        var combinationsSearched = 0;

        foreach (var cannySigma in cannySigmaGrid)
        foreach (var approxEpsilonFraction in approxEpsilonFractionGrid)
        {
            combinationsSearched++;
            var totalPredictedIoU = 0f;
            foreach (var photo in distinctPhotos)
            {
                var candidate = ClonePhotoWithCombination(photo, cannySigma, approxEpsilonFraction);
                totalPredictedIoU += predictionEngine.Predict(candidate).Score;
            }

            var averageIoU = totalPredictedIoU / distinctPhotos.Count;
            if (averageIoU > bestAverageIoU)
            {
                bestAverageIoU = averageIoU;
                bestCombination = new ThresholdCombination(cannySigma, approxEpsilonFraction);
            }
        }

        if (bestCombination is null)
        {
            throw new InvalidOperationException(
                "No valid threshold combination was found - this should be unreachable."
            );
        }

        return (bestCombination, bestAverageIoU, combinationsSearched);
    }

    private static CalibrationSampleRecord ClonePhotoWithCombination(
        CalibrationSampleRecord photo,
        float cannySigma,
        float approxEpsilonFraction
    ) =>
        new()
        {
            Ray0JumpMagnitude = photo.Ray0JumpMagnitude,
            Ray0JumpLocation = photo.Ray0JumpLocation,
            Ray1JumpMagnitude = photo.Ray1JumpMagnitude,
            Ray1JumpLocation = photo.Ray1JumpLocation,
            Ray2JumpMagnitude = photo.Ray2JumpMagnitude,
            Ray2JumpLocation = photo.Ray2JumpLocation,
            Ray3JumpMagnitude = photo.Ray3JumpMagnitude,
            Ray3JumpLocation = photo.Ray3JumpLocation,
            AspectRatio = photo.AspectRatio,
            MeanIntensity = photo.MeanIntensity,
            IntensityStdDev = photo.IntensityStdDev,
            CannySigma = cannySigma,
            ApproxEpsilonFraction = approxEpsilonFraction,
            SampleId = photo.SampleId,
        };

    private class IoUPrediction
    {
        [ColumnName("Score")]
        public float Score { get; set; }
    }
}
