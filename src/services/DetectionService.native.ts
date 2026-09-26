import {
  ObjectType,
  OpenCV,
  ColorConversionCodes,
  DataTypes,
  RotateFlags,
  RetrievalModes,
  ContourApproximationModes,
  AdaptiveThresholdTypes,
  ThresholdTypes,
  MorphTypes,
  MorphShapes,
  BorderTypes,
  NormTypes,
  Mat,
  PointVector,
  PointVectorOfVectors,
} from 'react-native-fast-opencv';
import { Point, ImageSource } from '@types';
import { initialPoints } from '@stores/useOverlayStore';
import { usePersistedSettingsStore } from '@stores/usePersistedSettingsStore';
import {
  APPROX_EPSILON_CANDIDATES,
  CANNY_SIGMA_CANDIDATES,
  DEFAULT_SHADOW_REMOVAL_KERNEL_FRACTION,
  DetectionThresholds,
  DiagonalFeatures,
  LineSegment,
  MAX_CONTOURS_TO_TEST,
  MIN_DETECTED_AREA_FRACTION,
  MIN_INNER_TO_OUTER_AREA_RATIO,
  MIN_LINE_SEGMENT_LENGTH_FRACTION,
  boundingBoxToPoints,
  computeAdaptiveCannySigma,
  computeDiagonalFeatures,
  computeFinalCornersFromRefittedLines,
  computeShadowRemovalKernelSize,
  detectQuadFromSegments,
  polygonArea,
  refitLineFromInliers,
  toOrderedRelativePoints,
  touchesImageBorder,
} from '@utils/detectionUtils';
import { SHIPPED_LEARNED_THRESHOLD_MODEL } from '@utils/shippedLearnedThresholdModel';
import { predictThresholdsFromFeatures } from '@utils/treeEnsembleUtils';
import { FileSystemService } from './FileSystemService';

export class DetectionService {
  /**
   * Attempts to automatically detect the 4 corners of a rectangular frame
   * (e.g. a painting) in the given image, for the Auto 4-Point tier.
   *
   * Always resolves to exactly 4 points in relative (0-1) coordinates,
   * ordered by corner - never rejects/throws to the caller. Falls back
   * through progressively less precise strategies (see the private helpers
   * below), and ultimately to the same centered-square default used for
   * manual (Free-tier) selection, so auto-detection can never leave the
   * user worse off than the existing manual flow.
   *
   * @param image - The source image with its URI and dimensions
   * @param signal - Optional AbortSignal for cancellation
   * @param thresholdOverrides - Optional detection thresholds to use instead
   * of the live persisted settings - used by the calibration sweep to test
   * many combinations without mutating the app's real settings
   * @returns Promise resolving to 4 points in relative (0-1) coordinates
   */
  static detectQuad = async (
    image: ImageSource,
    signal?: AbortSignal,
    thresholdOverrides?: DetectionThresholds
  ): Promise<Point[]> => {
    OpenCV.clearBuffers();

    const settings = usePersistedSettingsStore.getState();

    try {
      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const {
        uri,
        dimensions: { width, height },
        tags,
      } = image;

      if (!uri) {
        throw new Error('Image URI is null');
      }

      const base64 = await FileSystemService.getImageAsBase64(uri);

      if (!base64) {
        throw new Error('Image base64 is null');
      }

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      let src: Mat;
      const rotation = this.getRotation(tags?.Orientation);
      if (rotation !== null) {
        const originalOrientation = OpenCV.base64ToMat(base64);
        src = OpenCV.createObject(
          ObjectType.Mat,
          height,
          width,
          DataTypes.CV_8UC4
        );
        OpenCV.invoke('rotate', originalOrientation, src, rotation);
      } else {
        src = OpenCV.base64ToMat(base64);
      }

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const gray = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_8U
      );
      OpenCV.invoke(
        'cvtColor',
        src,
        gray,
        ColorConversionCodes.COLOR_BGRA2GRAY
      );

      const blurred = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_8U
      );
      OpenCV.invoke(
        'GaussianBlur',
        gray,
        blurred,
        OpenCV.createObject(ObjectType.Size, 5, 5),
        0
      );

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      // Purely a detection-accuracy aid, gated behind an internal/dev-only
      // toggle (see PersistedSettings.shadowRemovalEnabled's docs) - never
      // affects the actual transformed output, which always warps from the
      // original source image regardless of this setting.
      const detectionInput = settings.shadowRemovalEnabled
        ? this.removeShadowsForDetection(blurred, width, height)
        : blurred;

      const { cols: blurredCols, buffer: blurredBuffer } = OpenCV.matToBuffer(
        detectionInput,
        'uint8'
      );

      // A caller-provided override (the calibration sweep) always wins, so
      // it can test specific values without ever touching either learned
      // model or persisted settings. Next, a per-device learned model
      // applied via the Calibration screen's "Apply learned model to this
      // device" action (for live-testing one not yet committed). Then the
      // model committed to @assets/learnedThresholdModel.json and shipped
      // to every install (see SHIPPED_LEARNED_THRESHOLD_MODEL's docs) -
      // the same model DetectionService.ts (web) uses, so native and web
      // pick the same per-photo thresholds for the same photo. Falls back
      // to today's hand-derived heuristic plus settings otherwise.
      const activeLearnedModel =
        settings.learnedThresholdModel ?? SHIPPED_LEARNED_THRESHOLD_MODEL;
      let cannySigma: number;
      let approxEpsilonFraction: number;
      if (thresholdOverrides) {
        cannySigma = thresholdOverrides.cannySigma;
        approxEpsilonFraction = thresholdOverrides.approxEpsilonFraction;
      } else if (activeLearnedModel) {
        const features = computeDiagonalFeatures(
          (x, y) => blurredBuffer[y * blurredCols + x],
          width,
          height
        );
        ({ cannySigma, approxEpsilonFraction } = predictThresholdsFromFeatures(
          activeLearnedModel,
          features,
          CANNY_SIGMA_CANDIDATES,
          APPROX_EPSILON_CANDIDATES
        ));
      } else {
        cannySigma = computeAdaptiveCannySigma(
          (x, y) => blurredBuffer[y * blurredCols + x],
          width,
          height
        );
        approxEpsilonFraction = settings.approxEpsilonFraction;
      }

      // Alternate strategy, gated behind an internal/dev-only toggle (see
      // PersistedSettings.lineSegmentDetectionEnabled's docs) - replaces
      // all three contour-based strategies below entirely rather than
      // slotting in as a fourth fallback, so its own results can be
      // compared cleanly against the contour-based pipeline without
      // contour fallbacks masking its failures. A caller-provided
      // detectionStrategy override (the calibration sweep, comparing both
      // strategies against saved samples) always wins over the persisted
      // setting, same priority thresholdOverrides already has for
      // cannySigma/approxEpsilonFraction.
      const useLineSegments = thresholdOverrides?.detectionStrategy
        ? thresholdOverrides.detectionStrategy === 'lineSegment'
        : settings.lineSegmentDetectionEnabled;
      if (useLineSegments) {
        const viaLineSegments = this.detectQuadViaLineSegments(
          src,
          width,
          height
        );
        return viaLineSegments
          ? toOrderedRelativePoints(viaLineSegments, width, height)
          : initialPoints;
      }

      const viaCanny = this.findQuadViaCanny(
        blurred,
        detectionInput,
        width,
        height,
        cannySigma,
        approxEpsilonFraction
      );
      if (viaCanny) {
        return toOrderedRelativePoints(viaCanny, width, height);
      }

      const viaAdaptiveThreshold = this.findQuadViaAdaptiveThreshold(
        detectionInput,
        width,
        height,
        approxEpsilonFraction
      );
      if (viaAdaptiveThreshold) {
        return toOrderedRelativePoints(viaAdaptiveThreshold, width, height);
      }

      const largestContourBoundingBox = this.findLargestContourBoundingBox(
        blurred,
        detectionInput,
        width,
        height,
        cannySigma
      );
      if (largestContourBoundingBox) {
        return toOrderedRelativePoints(
          largestContourBoundingBox,
          width,
          height
        );
      }

      return initialPoints;
    } catch (error) {
      console.error('Error auto-detecting corners, using default', error);
      return initialPoints;
    } finally {
      OpenCV.clearBuffers();
    }
  };

  /**
   * Computes a photo's diagonal feature vector (see computeDiagonalFeatures)
   * without running the rest of the detection pipeline. Used when saving a
   * detection-calibration ground-truth sample (see saveCalibrationSample) -
   * the feature vector describes the photo itself, not the corner points a
   * user may have since dragged, so it's captured independently of whatever
   * detectQuad call (if any) already ran against this image.
   *
   * Resolves to null if the image can't be loaded/processed, mirroring
   * detectQuad's own never-throw contract - callers should treat this as
   * "no features available for this sample" rather than a hard failure.
   *
   * @param image - The source image with its URI and dimensions
   * @returns Promise resolving to the photo's diagonal feature vector, or
   * null if it couldn't be computed
   */
  static computeFeatures = async (
    image: ImageSource
  ): Promise<DiagonalFeatures | null> => {
    OpenCV.clearBuffers();

    const settings = usePersistedSettingsStore.getState();

    try {
      const {
        uri,
        dimensions: { width, height },
        tags,
      } = image;

      if (!uri) {
        return null;
      }

      const base64 = await FileSystemService.getImageAsBase64(uri);
      if (!base64) {
        return null;
      }

      let src: Mat;
      const rotation = this.getRotation(tags?.Orientation);
      if (rotation !== null) {
        const originalOrientation = OpenCV.base64ToMat(base64);
        src = OpenCV.createObject(
          ObjectType.Mat,
          height,
          width,
          DataTypes.CV_8UC4
        );
        OpenCV.invoke('rotate', originalOrientation, src, rotation);
      } else {
        src = OpenCV.base64ToMat(base64);
      }

      const gray = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_8U
      );
      OpenCV.invoke(
        'cvtColor',
        src,
        gray,
        ColorConversionCodes.COLOR_BGRA2GRAY
      );

      const blurred = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_8U
      );
      OpenCV.invoke(
        'GaussianBlur',
        gray,
        blurred,
        OpenCV.createObject(ObjectType.Size, 5, 5),
        0
      );

      const detectionInput = settings.shadowRemovalEnabled
        ? this.removeShadowsForDetection(blurred, width, height)
        : blurred;

      const { cols: blurredCols, buffer: blurredBuffer } = OpenCV.matToBuffer(
        detectionInput,
        'uint8'
      );
      return computeDiagonalFeatures(
        (x, y) => blurredBuffer[y * blurredCols + x],
        width,
        height
      );
    } catch (error) {
      console.error('Error computing calibration features', error);
      return null;
    } finally {
      OpenCV.clearBuffers();
    }
  };

  /**
   * Illumination-normalization preprocessing step, gated behind
   * PersistedSettings.shadowRemovalEnabled - purely a detection-accuracy
   * aid, never used for the actual transform (see detectQuad's use of it).
   *
   * Estimates a smooth background/illumination field via morphological
   * closing (dilate then erode) followed by opening (erode then dilate),
   * both with the same kernel. Closing erases small *dark* features
   * (a dark frame against a lighter wall); opening erases small *light*
   * features (a light frame against a darker wall) - running both in
   * sequence erases the frame's own edge either way, without needing to
   * detect in advance which is darker, the frame or the wall. It also
   * avoids the systematic bias a single dilate or erode would introduce
   * (each pushes its estimate toward the local max/min; closing then
   * opening with the same kernel roughly cancels that out), so the result
   * tracks the true local illumination level - including a shadow's slow
   * gradient - more faithfully.
   *
   * Subtracting that estimate back out (absdiff) and renormalizing to the
   * full 0-255 range cancels the slow shadow/lighting gradient while
   * leaving the frame's own much sharper boundary intact - exactly the
   * input Canny/adaptiveThreshold want. normalize's native binding only
   * takes a single alpha bound (see NormTypes.NORM_MINMAX usage below) -
   * its beta bound defaults to 0, which is exactly the [0, 255] range
   * wanted here.
   */
  private static removeShadowsForDetection(
    blurred: Mat,
    width: number,
    height: number
  ): Mat {
    const kernelSize = computeShadowRemovalKernelSize(
      width,
      height,
      DEFAULT_SHADOW_REMOVAL_KERNEL_FRACTION
    );
    const kernel = OpenCV.invoke(
      'getStructuringElement',
      MorphShapes.MORPH_RECT,
      OpenCV.createObject(ObjectType.Size, kernelSize, kernelSize)
    );

    const closed = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke(
      'morphologyEx',
      blurred,
      closed,
      MorphTypes.MORPH_CLOSE,
      kernel
    );

    const background = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke(
      'morphologyEx',
      closed,
      background,
      MorphTypes.MORPH_OPEN,
      kernel
    );

    const diff = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('absdiff', blurred, background, diff);

    const normalized = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('normalize', diff, normalized, 255, NormTypes.NORM_MINMAX);

    // Invert: absdiff is near-zero across flat background (the whole point
    // of this step) and only large right at a real edge, so without this
    // the result is a mostly-black image with edges as bright minority
    // pixels - the opposite of what a normal photo looks like. Every
    // downstream consumer (findQuadViaCanny's mean-relative auto-threshold,
    // computeAdaptiveCannySigma, computeDiagonalFeatures) assumes it's
    // looking at an ordinary mostly-bright-background photo; skipping this
    // inversion collapses the mean toward zero and drags Canny's thresholds
    // down with it, so it picks up everything as an edge instead of just
    // the frame.
    OpenCV.invoke('bitwise_not', normalized, normalized);

    return normalized;
  }

  /**
   * Builds a single "structural edge strength" map by taking the per-pixel
   * maximum of Sobel gradient magnitude across Lab's L, a, and b channels,
   * then thresholding it (Otsu - automatic, no meanIntensity heuristic
   * needed) into a binary edge mask. Directly targets a real failure the
   * default grayscale-only pipeline can't see: a photo where the
   * frame-vs-painting boundary was a strong *color* contrast (different
   * hue) but a weak *luminance* one - invisible to a pipeline that
   * discards color before ever looking for edges. A real edge in *any*
   * channel shows up here, luminance or either color axis.
   *
   * Used as both the input HoughLinesP scans for line segments and the
   * isEdgePixel signal for edge-support/nested-parallel scoring - one
   * preprocessing pass feeds everything downstream in the line-segment
   * strategy, rather than recomputing gradients per consumer.
   */
  private static computeColorAwareEdgeMap(
    src: Mat,
    width: number,
    height: number
  ): Mat {
    const rgb = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8UC3
    );
    OpenCV.invoke('cvtColor', src, rgb, ColorConversionCodes.COLOR_BGRA2BGR);

    const lab = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8UC3
    );
    OpenCV.invoke('cvtColor', rgb, lab, ColorConversionCodes.COLOR_BGR2Lab);

    const channels = OpenCV.createObject(ObjectType.MatVector);
    OpenCV.invoke('split', lab, channels);

    // Seeded from channel 0's own magnitude (rather than a separately
    // zero-initialized Mat) - max-combining against a real starting
    // magnitude is equivalent to starting from zero, since magnitude is
    // never negative.
    let combined: Mat | null = null;
    for (let i = 0; i < 3; i++) {
      const channel = OpenCV.copyObjectFromVector(channels, i);
      const gradX = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_32F
      );
      const gradY = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_32F
      );
      OpenCV.invoke(
        'Sobel',
        channel,
        gradX,
        DataTypes.CV_32F,
        1,
        0,
        3,
        1,
        0,
        BorderTypes.BORDER_DEFAULT
      );
      OpenCV.invoke(
        'Sobel',
        channel,
        gradY,
        DataTypes.CV_32F,
        0,
        1,
        3,
        1,
        0,
        BorderTypes.BORDER_DEFAULT
      );
      const magnitude = OpenCV.createObject(
        ObjectType.Mat,
        height,
        width,
        DataTypes.CV_32F
      );
      OpenCV.invoke('magnitude', gradX, gradY, magnitude);
      if (combined) {
        OpenCV.invoke('max', combined, magnitude, combined);
      } else {
        combined = magnitude;
      }
    }
    if (!combined) {
      throw new Error('computeColorAwareEdgeMap: no color channels found');
    }

    const normalized = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_32F
    );
    OpenCV.invoke(
      'normalize',
      combined,
      normalized,
      255,
      NormTypes.NORM_MINMAX
    );
    const combined8U = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('convertTo', normalized, combined8U, DataTypes.CV_8U);

    const edgeMap = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke(
      'threshold',
      combined8U,
      edgeMap,
      0,
      255,
      ThresholdTypes.THRESH_BINARY | ThresholdTypes.THRESH_OTSU
    );

    return edgeMap;
  }

  /**
   * Alternate detection strategy: HoughLinesP-based line-segment detection
   * instead of contour tracing (see detectQuadFromSegments's docs on why -
   * a broken/discontinuous edge defeats contour-tracing entirely, but
   * merged line segments tolerate real gaps). Never throws - returns null
   * on any failure, matching every other strategy's contract here.
   *
   * Unlike web, this genuinely is a full-resolution pipeline end to end:
   * native never downscales before detection (see MAX_DETECTION_DIMENSION's
   * docs on why web does and native doesn't), so the full-resolution robust
   * re-fit (refitLineFromInliers) operates on real full-resolution data
   * here, not just the same working-resolution points web is currently
   * limited to.
   *
   * Native's HoughLinesP is truncated to the 5-argument form (confirmed
   * against FOCV_Function.cpp's dispatch table) - no minLineLength/
   * maxLineGap. Length filtering happens manually below instead; gap
   * merging is already handled by mergeCollinearSegments regardless of
   * platform, so no separate native-only gap logic is needed.
   */
  private static detectQuadViaLineSegments(
    src: Mat,
    width: number,
    height: number
  ): Point[] | null {
    const edgeMap = this.computeColorAwareEdgeMap(src, width, height);
    const { cols: edgeCols, buffer: edgeBuffer } = OpenCV.matToBuffer(
      edgeMap,
      'uint8'
    );
    const isEdgePixel = (x: number, y: number): boolean => {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return false;
      }
      return edgeBuffer[y * edgeCols + x] > 0;
    };

    const lines = OpenCV.createObject(ObjectType.Mat, 1, 1, DataTypes.CV_32SC4);
    OpenCV.invoke('HoughLinesP', edgeMap, lines, 1, Math.PI / 180, 40);

    const { rows: lineCount, buffer: lineBuffer } = OpenCV.matToBuffer(
      lines,
      'int32'
    );
    const diagonal = Math.hypot(width, height);
    const minLineLength = MIN_LINE_SEGMENT_LENGTH_FRACTION * diagonal;

    const segments: LineSegment[] = [];
    for (let i = 0; i < lineCount; i++) {
      const x1 = lineBuffer[i * 4];
      const y1 = lineBuffer[i * 4 + 1];
      const x2 = lineBuffer[i * 4 + 2];
      const y2 = lineBuffer[i * 4 + 3];
      if (Math.hypot(x2 - x1, y2 - y1) >= minLineLength) {
        segments.push({ x1, y1, x2, y2 });
      }
    }

    const coarseResult = detectQuadFromSegments(
      segments,
      isEdgePixel,
      width,
      height
    );
    if (!coarseResult) {
      return null;
    }

    const [lineA1, lineA2, lineB1, lineB2] = coarseResult.contributingLines;
    const refittedA1 = refitLineFromInliers(lineA1.points);
    const refittedA2 = refitLineFromInliers(lineA2.points);
    const refittedB1 = refitLineFromInliers(lineB1.points);
    const refittedB2 = refitLineFromInliers(lineB2.points);
    const finalCorners = computeFinalCornersFromRefittedLines(
      refittedA1.line,
      refittedA2.line,
      refittedB1.line,
      refittedB2.line
    );

    return finalCorners ?? coarseResult.points;
  }

  /**
   * Primary detection strategy: edge-based. Works well for a frame with
   * reasonable contrast against its background.
   *
   * meanIntensitySource and cannyInput are deliberately separate Mats: the
   * mean-relative auto-threshold below assumes it's looking at an ordinary
   * photo (a mostly-mid-range brightness distribution), which is exactly
   * what breaks if shadow removal is enabled - detectionInput is then a
   * mostly-bright-background edge-emphasized image (see
   * removeShadowsForDetection's docs), whose mean sits up near 255
   * regardless of the photo's real contrast. Using that mean here produces
   * a threshold band far too narrow for the frame's actual edge to clear.
   * Always calibrating from the original (pre-shadow-removal) blurred
   * image keeps this heuristic's assumption true, while still running the
   * actual Canny scan against whichever image detectQuad decided on.
   */
  private static findQuadViaCanny(
    meanIntensitySource: Mat,
    cannyInput: Mat,
    width: number,
    height: number,
    cannySigma: number,
    approxEpsilonFraction: number
  ): Point[] | null {
    const meanIntensity = OpenCV.toJSValue(
      OpenCV.invoke('mean', meanIntensitySource)
    ).a;

    // Standard auto-Canny heuristic: threshold around the image's own mean
    // intensity rather than fixed constants, since gallery lighting varies
    // a lot photo to photo.
    const lowerThreshold = Math.max(0, (1 - cannySigma) * meanIntensity);
    const upperThreshold = Math.min(255, (1 + cannySigma) * meanIntensity);

    const edges = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('Canny', cannyInput, edges, lowerThreshold, upperThreshold);

    const dilated = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    const kernel = OpenCV.invoke(
      'getStructuringElement',
      MorphShapes.MORPH_RECT,
      OpenCV.createObject(ObjectType.Size, 3, 3)
    );
    OpenCV.invoke(
      'dilate',
      edges,
      dilated,
      kernel,
      this.zeroAnchor(),
      2,
      BorderTypes.BORDER_CONSTANT,
      OpenCV.createObject(ObjectType.Scalar, 0)
    );

    return this.findQuadFromBinaryMask(
      dilated,
      width,
      height,
      approxEpsilonFraction
    );
  }

  /**
   * Fallback detection strategy: adaptive-threshold based. Handles
   * low-contrast frames (e.g. a light frame against a similarly light
   * wall) where Canny's edge response is too weak to find a clean contour.
   */
  private static findQuadViaAdaptiveThreshold(
    blurred: Mat,
    width: number,
    height: number,
    approxEpsilonFraction: number
  ): Point[] | null {
    const thresholded = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke(
      'adaptiveThreshold',
      blurred,
      thresholded,
      255,
      AdaptiveThresholdTypes.ADAPTIVE_THRESH_GAUSSIAN_C,
      ThresholdTypes.THRESH_BINARY,
      11,
      2
    );

    const closed = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    const kernel = OpenCV.invoke(
      'getStructuringElement',
      MorphShapes.MORPH_RECT,
      OpenCV.createObject(ObjectType.Size, 5, 5)
    );
    OpenCV.invoke(
      'morphologyEx',
      thresholded,
      closed,
      MorphTypes.MORPH_CLOSE,
      kernel
    );

    return this.findQuadFromBinaryMask(
      closed,
      width,
      height,
      approxEpsilonFraction
    );
  }

  /**
   * Simplifies a single contour toward a 4-point quad and accepts it only
   * if it lands on exactly 4 points, covers enough of the image, and
   * doesn't touch the image border (see touchesImageBorder's docs). Shared
   * by both the outer-frame and inner-edge candidate checks in
   * findQuadFromBinaryMask below. Unlike the web implementation, this has
   * no escalating-epsilon retry (a pre-existing platform divergence, not
   * introduced here).
   */
  private static approximateContourToQuad(
    contour: PointVector,
    width: number,
    height: number,
    approxEpsilonFraction: number,
    minArea: number
  ): Point[] | null {
    const perimeter = OpenCV.invoke('arcLength', contour, true).value;
    const approx = OpenCV.createObject(ObjectType.PointVector);
    OpenCV.invoke(
      'approxPolyDP',
      contour,
      approx,
      approxEpsilonFraction * perimeter,
      true
    );
    const approxPoints = OpenCV.toJSValue(approx).array;
    const approxArea = polygonArea(approxPoints);

    if (
      approxPoints.length === 4 &&
      approxArea >= minArea &&
      !touchesImageBorder(approxPoints, width, height)
    ) {
      return approxPoints;
    }
    return null;
  }

  /**
   * Shared contour-search logic for both detection strategies above: finds
   * contours in a binary mask and tests the largest few by area (see
   * approximateContourToQuad for the per-contour acceptance criteria).
   *
   * Uses RETR_CCOMP rather than RETR_EXTERNAL so a frame's inner edge -
   * the hole formed by the painting inside it - is retrievable at all: a
   * frame is often close in tone to the wall behind it (weak outer edge),
   * while the painting inside is almost always higher-contrast than the
   * frame around it (strong inner edge). RETR_EXTERNAL would silently
   * discard that inner contour entirely, since it only returns the
   * outermost contour of each shape. Once a candidate passes as a valid
   * outer frame, its *direct* child in the hierarchy (if any) is tried as
   * a possible inner-edge candidate and preferred if it also validates -
   * deliberately restricted to a direct child rather than any other large
   * rectangle in the photo, so a shape drawn within the painting itself
   * (e.g. a geometric composition) is structurally ineligible: it would be
   * a grandchild or deeper, never the outer candidate's immediate child.
   */
  private static findQuadFromBinaryMask(
    binaryMask: Mat,
    width: number,
    height: number,
    approxEpsilonFraction: number
  ): Point[] | null {
    const contours = OpenCV.createObject(ObjectType.PointVectorOfVectors);
    // Placeholder shape - findContoursWithHierarchy reallocates this to the
    // real (contourCount x 1, 4-channel) shape internally, same as the
    // stock OpenCV C++ API does for an empty-constructed cv::Mat.
    const hierarchy = OpenCV.createObject(
      ObjectType.Mat,
      1,
      1,
      DataTypes.CV_32SC4
    );
    OpenCV.invoke(
      'findContoursWithHierarchy',
      binaryMask,
      contours,
      hierarchy,
      RetrievalModes.RETR_CCOMP,
      ContourApproximationModes.CHAIN_APPROX_SIMPLE
    );

    const contourPoints = OpenCV.toJSValue(contours).array;
    if (contourPoints.length === 0) {
      return null;
    }

    // Nx1, 4 channels per contour: [next, previous, firstChild, parent] -
    // see cv::findContours's own documentation for this layout. -1 means
    // "none".
    const { buffer: hierarchyBuffer } = OpenCV.matToBuffer(hierarchy, 'int32');

    const minArea = MIN_DETECTED_AREA_FRACTION * width * height;
    const largestIndicesFirst = contourPoints
      .map((points, index) => ({ index, area: polygonArea(points) }))
      .sort((a, b) => b.area - a.area)
      .slice(0, MAX_CONTOURS_TO_TEST);

    for (const { index, area } of largestIndicesFirst) {
      if (area < minArea) {
        continue;
      }

      const contour = OpenCV.copyObjectFromVector(contours, index);
      const outerQuad = this.approximateContourToQuad(
        contour,
        width,
        height,
        approxEpsilonFraction,
        minArea
      );
      if (!outerQuad) {
        continue;
      }

      const firstChildIndex = hierarchyBuffer[index * 4 + 2];
      if (firstChildIndex !== -1) {
        const childArea = polygonArea(contourPoints[firstChildIndex]);
        if (
          childArea >= minArea &&
          childArea >= MIN_INNER_TO_OUTER_AREA_RATIO * area
        ) {
          const childContour = OpenCV.copyObjectFromVector(
            contours,
            firstChildIndex
          );
          const innerQuad = this.approximateContourToQuad(
            childContour,
            width,
            height,
            approxEpsilonFraction,
            minArea
          );
          if (innerQuad) {
            return innerQuad;
          }
        }
      }

      return outerQuad;
    }

    return null;
  }

  /**
   * Last-resort fallback: if no contour approximates cleanly to a
   * quadrilateral, use the axis-aligned bounding box of the single largest
   * contour found. Less precise (ignores any rotation/skew), but still a
   * meaningfully better starting point than the generic centered default.
   *
   * See findQuadViaCanny's docs on why meanIntensitySource and cannyInput
   * are separate Mats.
   */
  private static findLargestContourBoundingBox(
    meanIntensitySource: Mat,
    cannyInput: Mat,
    width: number,
    height: number,
    cannySigma: number
  ): Point[] | null {
    const meanIntensity = OpenCV.toJSValue(
      OpenCV.invoke('mean', meanIntensitySource)
    ).a;
    const lowerThreshold = Math.max(0, (1 - cannySigma) * meanIntensity);
    const upperThreshold = Math.min(255, (1 + cannySigma) * meanIntensity);

    const edges = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('Canny', cannyInput, edges, lowerThreshold, upperThreshold);

    const contours: PointVectorOfVectors = OpenCV.createObject(
      ObjectType.PointVectorOfVectors
    );
    OpenCV.invoke(
      'findContours',
      edges,
      contours,
      RetrievalModes.RETR_LIST,
      ContourApproximationModes.CHAIN_APPROX_SIMPLE
    );

    const contourPoints = OpenCV.toJSValue(contours).array;
    if (contourPoints.length === 0) {
      return null;
    }

    let largest: Point[] | null = null;
    let largestArea = 0;
    for (const points of contourPoints) {
      const area = polygonArea(points);
      if (area > largestArea) {
        // Skip a contour tracing the image's own border - see
        // touchesImageBorder's docs.
        if (!touchesImageBorder(points, width, height)) {
          largest = points;
          largestArea = area;
        }
      }
    }

    if (!largest || largestArea < MIN_DETECTED_AREA_FRACTION * width * height) {
      return null;
    }

    return boundingBoxToPoints(largest);
  }

  private static zeroAnchor() {
    return OpenCV.createObject(ObjectType.Point, -1, -1);
  }

  private static getRotation(orientation: number | undefined) {
    switch (orientation) {
      case 5:
      case 6:
        return RotateFlags.ROTATE_90_CLOCKWISE;
      case 7:
      case 8:
        return RotateFlags.ROTATE_90_COUNTERCLOCKWISE;
      case 3:
      case 4:
        return RotateFlags.ROTATE_180;
      default:
        return null;
    }
  }
}
