namespace CalibrationApi.Models;

/// <summary>
/// One (photo, threshold-combination) evaluation: the photo's diagonal
/// feature vector (see detectionUtils.ts's computeDiagonalFeatures on the
/// client - the field order here must match it exactly), the threshold
/// combination that was tried against it, and the IoU that combination
/// achieved against the photo's hand-marked ground truth. The client
/// computes and evaluates these entirely on-device (it already runs the
/// real OpenCV pipeline for its own sweep) - this service never receives
/// or processes image bytes, only these numbers.
/// </summary>
public class CalibrationSampleRecord
{
    // Diagonal-derived features, one (magnitude, location) pair per
    // corner-to-center ray, plus a few whole-image statistics.
    public float Ray0JumpMagnitude { get; set; }
    public float Ray0JumpLocation { get; set; }
    public float Ray1JumpMagnitude { get; set; }
    public float Ray1JumpLocation { get; set; }
    public float Ray2JumpMagnitude { get; set; }
    public float Ray2JumpLocation { get; set; }
    public float Ray3JumpMagnitude { get; set; }
    public float Ray3JumpLocation { get; set; }
    public float AspectRatio { get; set; }
    public float MeanIntensity { get; set; }
    public float IntensityStdDev { get; set; }

    // The threshold combination evaluated against this photo. Area-fraction
    // bounds aren't here: the client fixed its minimum as a hardcoded
    // sanity constant and retired its maximum once touchesImageBorder took
    // over that job more precisely - cannySigma and approxEpsilonFraction
    // are the only thresholds that vary photo to photo and benefit from
    // tuning.
    public float CannySigma { get; set; }
    public float ApproxEpsilonFraction { get; set; }

    /// <summary>
    /// The regression label: how well this threshold combination detected
    /// this specific photo's frame, 0 (no overlap) to 1 (perfect).
    /// </summary>
    public float Iou { get; set; }

    /// <summary>
    /// Identifies which photo this record's feature columns came from, so
    /// training can group records back into distinct photos (each photo
    /// appears many times, once per threshold combination tried against
    /// it) without needing to compare floating-point feature values.
    /// </summary>
    public string SampleId { get; set; } = string.Empty;
}
