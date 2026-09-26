import cv, { EmscriptenEmbindInstance } from '@techstark/opencv-js';
import { Point, ImageSource } from '@types';
import { initialPoints } from '@stores/useOverlayStore';
import { usePersistedSettingsStore } from '@stores/usePersistedSettingsStore';
import {
  APPROX_EPSILON_CANDIDATES,
  APPROX_EPSILON_RETRY_MULTIPLIERS,
  CANNY_SIGMA_CANDIDATES,
  DEFAULT_SHADOW_REMOVAL_KERNEL_FRACTION,
  DetectionThresholds,
  DiagonalFeatures,
  LineSegment,
  MAX_CONTOURS_TO_TEST,
  MAX_DETECTION_DIMENSION,
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
import { debugLog } from '@utils/debugLog';
import { SHIPPED_LEARNED_THRESHOLD_MODEL } from '@utils/shippedLearnedThresholdModel';
import { predictThresholdsFromFeatures } from '@utils/treeEnsembleUtils';
import { TransformService } from './TransformService';

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
    debugLog('>>>> detectQuad: start', {
      uri: image.uri,
      dimensions: image.dimensions,
      thresholdOverrides,
    });

    if (!cv || !cv.Mat || !image.uri) {
      debugLog('>>>> detectQuad: no cv/cv.Mat/uri, falling back to default');
      return initialPoints;
    }

    const {
      uri,
      dimensions: { width, height },
    } = image;

    const settings = usePersistedSettingsStore.getState();

    const itemsToDelete: EmscriptenEmbindInstance[] = [];

    try {
      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const imageElement = await TransformService.getHTMLImageElement(uri);

      // Detection never needs full photo resolution to find a quad's rough
      // shape, and running the pipeline at (e.g.) 12MP+ can allocate enough
      // simultaneous cv.Mat buffers (source RGBA, grayscale, blurred, edges,
      // plus whichever fallback strategies run) to exceed the WASM heap -
      // which crashes the whole tab rather than throwing a catchable error.
      // Downscaling via canvas *before* cv.imread (rather than after) avoids
      // ever allocating a full-resolution Mat at all. The resulting points
      // are converted to relative (0-1) coordinates using these working
      // dimensions, so accuracy for the final overlay is unaffected -
      // toOrderedRelativePoints only cares that the points and the
      // width/height it's given are in the same coordinate space.
      const scale = Math.min(
        1,
        MAX_DETECTION_DIMENSION / Math.max(width, height)
      );
      const workingWidth = Math.round(width * scale);
      const workingHeight = Math.round(height * scale);
      debugLog('>>>> detectQuad: downscale decision', {
        scale,
        workingWidth,
        workingHeight,
      });

      let src: cv.Mat;
      if (scale < 1) {
        const canvas = document.createElement('canvas');
        canvas.width = workingWidth;
        canvas.height = workingHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not get 2D canvas context for downscaling');
        }
        context.drawImage(imageElement, 0, 0, workingWidth, workingHeight);
        src = cv.imread(canvas);
      } else {
        src = cv.imread(imageElement);
      }
      itemsToDelete.push(src);

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const gray = new cv.Mat();
      itemsToDelete.push(gray);
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const blurred = new cv.Mat();
      itemsToDelete.push(blurred);
      // cv.Size, unlike cv.Mat, is a plain JS class in this library (see
      // _hacks.d.ts) - not an EmscriptenEmbindInstance, so it has no
      // .delete() and doesn't belong in itemsToDelete.
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);
      debugLog('>>>> detectQuad: actual Mat dimensions vs assumed', {
        matCols: blurred.cols,
        matRows: blurred.rows,
        workingWidth,
        workingHeight,
        mismatch:
          blurred.cols !== workingWidth || blurred.rows !== workingHeight,
      });

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      // Purely a detection-accuracy aid, gated behind an internal/dev-only
      // toggle (see PersistedSettings.shadowRemovalEnabled's docs) - never
      // affects the actual transformed output, which always warps from the
      // original source image regardless of this setting.
      const detectionInput = settings.shadowRemovalEnabled
        ? this.removeShadowsForDetection(
            blurred,
            workingWidth,
            workingHeight,
            itemsToDelete
          )
        : blurred;
      debugLog('>>>> detectQuad: shadow removal', {
        shadowRemovalEnabled: settings.shadowRemovalEnabled,
      });

      // A caller-provided override (the calibration sweep) always wins, so
      // it can test specific values without ever touching either learned
      // model or persisted settings. Next, a per-device learned model
      // applied via the Calibration screen's "Apply learned model to this
      // device" action (for live-testing one not yet committed). Then the
      // model committed to @assets/learnedThresholdModel.json and shipped
      // to every install (see SHIPPED_LEARNED_THRESHOLD_MODEL's docs).
      // Either learned model picks per-photo thresholds from this photo's
      // own features (see predictThresholdsFromFeatures's docs) - a real
      // improvement over one fixed pair for every photo. Falls back to
      // today's hand-derived heuristic plus settings otherwise.
      const activeLearnedModel =
        settings.learnedThresholdModel ?? SHIPPED_LEARNED_THRESHOLD_MODEL;
      let cannySigma: number;
      let approxEpsilonFraction: number;
      if (thresholdOverrides) {
        cannySigma = thresholdOverrides.cannySigma;
        approxEpsilonFraction = thresholdOverrides.approxEpsilonFraction;
      } else if (activeLearnedModel) {
        const features = computeDiagonalFeatures(
          (x, y) => detectionInput.data[y * detectionInput.cols + x],
          workingWidth,
          workingHeight
        );
        ({ cannySigma, approxEpsilonFraction } = predictThresholdsFromFeatures(
          activeLearnedModel,
          features,
          CANNY_SIGMA_CANDIDATES,
          APPROX_EPSILON_CANDIDATES
        ));
      } else {
        cannySigma = computeAdaptiveCannySigma(
          (x, y) => detectionInput.data[y * detectionInput.cols + x],
          workingWidth,
          workingHeight
        );
        approxEpsilonFraction = settings.approxEpsilonFraction;
      }
      debugLog('>>>> detectQuad: computed thresholds', {
        cannySigma,
        approxEpsilonFraction,
        usedLearnedModel: !thresholdOverrides && !!activeLearnedModel,
      });

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
          workingWidth,
          workingHeight,
          itemsToDelete
        );
        if (viaLineSegments) {
          debugLog(
            '>>>> detectQuad: succeeded via line segments',
            viaLineSegments
          );
          return toOrderedRelativePoints(
            viaLineSegments,
            workingWidth,
            workingHeight
          );
        }
        debugLog(
          '>>>> detectQuad: line-segment strategy found nothing, falling back to default centered square'
        );
        return initialPoints;
      }

      const viaCanny = this.findQuadViaCanny(
        blurred,
        detectionInput,
        workingWidth,
        workingHeight,
        cannySigma,
        approxEpsilonFraction,
        itemsToDelete
      );
      if (viaCanny) {
        debugLog('>>>> detectQuad: succeeded via Canny', viaCanny);
        return toOrderedRelativePoints(viaCanny, workingWidth, workingHeight);
      }
      debugLog(
        '>>>> detectQuad: Canny strategy found nothing, trying adaptive threshold'
      );

      const viaAdaptiveThreshold = this.findQuadViaAdaptiveThreshold(
        detectionInput,
        workingWidth,
        workingHeight,
        approxEpsilonFraction,
        itemsToDelete
      );
      if (viaAdaptiveThreshold) {
        debugLog(
          '>>>> detectQuad: succeeded via adaptive threshold',
          viaAdaptiveThreshold
        );
        return toOrderedRelativePoints(
          viaAdaptiveThreshold,
          workingWidth,
          workingHeight
        );
      }
      debugLog(
        '>>>> detectQuad: adaptive threshold strategy found nothing, trying largest-contour bounding box'
      );

      const largestContourBoundingBox = this.findLargestContourBoundingBox(
        blurred,
        detectionInput,
        workingWidth,
        workingHeight,
        cannySigma,
        itemsToDelete
      );
      if (largestContourBoundingBox) {
        debugLog(
          '>>>> detectQuad: succeeded via largest-contour bounding box',
          largestContourBoundingBox
        );
        return toOrderedRelativePoints(
          largestContourBoundingBox,
          workingWidth,
          workingHeight
        );
      }

      debugLog(
        '>>>> detectQuad: every strategy failed, falling back to default centered square'
      );
      return initialPoints;
    } catch (error) {
      debugLog('>>>> detectQuad: threw, falling back to default', {
        error: String(error),
      });
      console.error('Error auto-detecting corners, using default', error);
      return initialPoints;
    } finally {
      itemsToDelete.forEach((item) => item.delete());
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
    if (!cv || !cv.Mat || !image.uri) {
      return null;
    }

    const {
      uri,
      dimensions: { width, height },
    } = image;

    const settings = usePersistedSettingsStore.getState();
    const itemsToDelete: EmscriptenEmbindInstance[] = [];
    try {
      const imageElement = await TransformService.getHTMLImageElement(uri);

      const scale = Math.min(
        1,
        MAX_DETECTION_DIMENSION / Math.max(width, height)
      );
      const workingWidth = Math.round(width * scale);
      const workingHeight = Math.round(height * scale);

      let src: cv.Mat;
      if (scale < 1) {
        const canvas = document.createElement('canvas');
        canvas.width = workingWidth;
        canvas.height = workingHeight;
        const context = canvas.getContext('2d');
        if (!context) {
          throw new Error('Could not get 2D canvas context for downscaling');
        }
        context.drawImage(imageElement, 0, 0, workingWidth, workingHeight);
        src = cv.imread(canvas);
      } else {
        src = cv.imread(imageElement);
      }
      itemsToDelete.push(src);

      const gray = new cv.Mat();
      itemsToDelete.push(gray);
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const blurred = new cv.Mat();
      itemsToDelete.push(blurred);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      const detectionInput = settings.shadowRemovalEnabled
        ? this.removeShadowsForDetection(
            blurred,
            workingWidth,
            workingHeight,
            itemsToDelete
          )
        : blurred;

      return computeDiagonalFeatures(
        (x, y) => detectionInput.data[y * detectionInput.cols + x],
        workingWidth,
        workingHeight
      );
    } catch (error) {
      console.error('Error computing calibration features', error);
      return null;
    } finally {
      itemsToDelete.forEach((item) => item.delete());
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
   * input Canny/adaptiveThreshold want.
   */
  private static removeShadowsForDetection(
    blurred: cv.Mat,
    width: number,
    height: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): cv.Mat {
    const kernelSize = computeShadowRemovalKernelSize(
      width,
      height,
      DEFAULT_SHADOW_REMOVAL_KERNEL_FRACTION
    );
    const kernel = cv.Mat.ones(kernelSize, kernelSize, cv.CV_8U);
    itemsToDelete.push(kernel);

    const closed = new cv.Mat();
    itemsToDelete.push(closed);
    cv.morphologyEx(blurred, closed, cv.MORPH_CLOSE, kernel);

    const background = new cv.Mat();
    itemsToDelete.push(background);
    cv.morphologyEx(closed, background, cv.MORPH_OPEN, kernel);

    const diff = new cv.Mat();
    itemsToDelete.push(diff);
    cv.absdiff(blurred, background, diff);

    const normalized = new cv.Mat();
    itemsToDelete.push(normalized);
    cv.normalize(diff, normalized, 0, 255, cv.NORM_MINMAX);

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
    cv.bitwise_not(normalized, normalized);

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
    src: cv.Mat,
    width: number,
    height: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): cv.Mat {
    const rgb = new cv.Mat();
    itemsToDelete.push(rgb);
    cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);

    const lab = new cv.Mat();
    itemsToDelete.push(lab);
    cv.cvtColor(rgb, lab, cv.COLOR_RGB2Lab);

    const channels = new cv.MatVector();
    itemsToDelete.push(channels);
    cv.split(lab, channels);

    // Seeded from channel 0's own magnitude (rather than a separately
    // zero-initialized Mat) so this doesn't depend on a specific
    // zero-fill API being available identically on both platforms -
    // max-combining against a real starting magnitude is equivalent to
    // starting from zero, since magnitude is never negative.
    let combined: cv.Mat | null = null;
    for (let i = 0; i < 3; i++) {
      const channel = channels.get(i);
      itemsToDelete.push(channel);
      const gradX = new cv.Mat();
      itemsToDelete.push(gradX);
      const gradY = new cv.Mat();
      itemsToDelete.push(gradY);
      cv.Sobel(channel, gradX, cv.CV_32F, 1, 0, 3);
      cv.Sobel(channel, gradY, cv.CV_32F, 0, 1, 3);
      const magnitude = new cv.Mat();
      itemsToDelete.push(magnitude);
      cv.magnitude(gradX, gradY, magnitude);
      if (combined) {
        cv.max(combined, magnitude, combined);
      } else {
        combined = magnitude;
      }
    }
    if (!combined) {
      throw new Error('computeColorAwareEdgeMap: no color channels found');
    }

    const normalized = new cv.Mat();
    itemsToDelete.push(normalized);
    cv.normalize(combined, normalized, 0, 255, cv.NORM_MINMAX);
    const combined8U = new cv.Mat();
    itemsToDelete.push(combined8U);
    normalized.convertTo(combined8U, cv.CV_8U);

    const edgeMap = new cv.Mat();
    itemsToDelete.push(edgeMap);
    cv.threshold(
      combined8U,
      edgeMap,
      0,
      255,
      cv.THRESH_BINARY | cv.THRESH_OTSU
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
   * The full-resolution robust re-fit (see refitLineFromInliers) operates
   * on the same working-resolution points the coarse pass already found,
   * not a separately-loaded full-resolution image: web's detection
   * pipeline already downscales before any OpenCV call at all (see
   * MAX_DETECTION_DIMENSION's docs on why - WASM heap limits), and loading
   * a second full-resolution copy just for this refit would reintroduce
   * that exact risk. The refit still adds real value at this resolution
   * (outlier-robust fitting across every contributing segment endpoint,
   * rather than a single approxPolyDP-style simplification), just not the
   * additional full-resolution precision a genuinely separate high-res
   * pass would add - a real, currently-unclaimed follow-up, not something
   * this implementation claims to already do.
   */
  private static detectQuadViaLineSegments(
    src: cv.Mat,
    width: number,
    height: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const edgeMap = this.computeColorAwareEdgeMap(
      src,
      width,
      height,
      itemsToDelete
    );
    const isEdgePixel = (x: number, y: number): boolean => {
      if (x < 0 || x >= width || y < 0 || y >= height) {
        return false;
      }
      return edgeMap.data[y * edgeMap.cols + x] > 0;
    };

    const diagonal = Math.hypot(width, height);
    const lines = new cv.Mat();
    itemsToDelete.push(lines);
    cv.HoughLinesP(
      edgeMap,
      lines,
      1,
      Math.PI / 180,
      40,
      MIN_LINE_SEGMENT_LENGTH_FRACTION * diagonal,
      0.02 * diagonal
    );

    const segments: LineSegment[] = [];
    for (let i = 0; i < lines.rows; i++) {
      segments.push({
        x1: lines.data32S[i * 4],
        y1: lines.data32S[i * 4 + 1],
        x2: lines.data32S[i * 4 + 2],
        y2: lines.data32S[i * 4 + 3],
      });
    }
    debugLog('>>>> detectQuadViaLineSegments: segment count', segments.length);

    const coarseResult = detectQuadFromSegments(
      segments,
      isEdgePixel,
      width,
      height
    );
    if (!coarseResult) {
      debugLog('>>>> detectQuadViaLineSegments: no candidate found');
      return null;
    }
    debugLog('>>>> detectQuadViaLineSegments: coarse result', {
      points: coarseResult.points,
      confidence: coarseResult.confidence,
      scoreBreakdown: coarseResult.scoreBreakdown,
    });

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
    debugLog('>>>> detectQuadViaLineSegments: full-res refit', {
      finalCorners,
      inlierFractions: [
        refittedA1.inlierFraction,
        refittedA2.inlierFraction,
        refittedB1.inlierFraction,
        refittedB2.inlierFraction,
      ],
    });

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
    meanIntensitySource: cv.Mat,
    cannyInput: cv.Mat,
    width: number,
    height: number,
    cannySigma: number,
    approxEpsilonFraction: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const meanIntensity = cv.mean(meanIntensitySource)[0];

    // Standard auto-Canny heuristic: threshold around the image's own mean
    // intensity rather than fixed constants, since gallery lighting varies
    // a lot photo to photo.
    const lowerThreshold = Math.max(0, (1 - cannySigma) * meanIntensity);
    const upperThreshold = Math.min(255, (1 + cannySigma) * meanIntensity);
    debugLog('>>>> findQuadViaCanny: thresholds', {
      meanIntensity,
      lowerThreshold,
      upperThreshold,
    });

    const edges = new cv.Mat();
    itemsToDelete.push(edges);
    cv.Canny(cannyInput, edges, lowerThreshold, upperThreshold);

    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    itemsToDelete.push(kernel);
    // cv.Point, unlike cv.Mat, is a plain JS class in this library (see
    // _hacks.d.ts) - not an EmscriptenEmbindInstance, so it has no
    // .delete() and doesn't belong in itemsToDelete.
    cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 2);

    return this.findQuadFromBinaryMask(
      edges,
      width,
      height,
      approxEpsilonFraction,
      itemsToDelete,
      'canny'
    );
  }

  /**
   * Fallback detection strategy: adaptive-threshold based. Handles
   * low-contrast frames (e.g. a light frame against a similarly light
   * wall) where Canny's edge response is too weak to find a clean contour.
   */
  private static findQuadViaAdaptiveThreshold(
    blurred: cv.Mat,
    width: number,
    height: number,
    approxEpsilonFraction: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const thresholded = new cv.Mat();
    itemsToDelete.push(thresholded);
    cv.adaptiveThreshold(
      blurred,
      thresholded,
      255,
      cv.ADAPTIVE_THRESH_GAUSSIAN_C,
      cv.THRESH_BINARY,
      11,
      2
    );

    const kernel = cv.Mat.ones(5, 5, cv.CV_8U);
    itemsToDelete.push(kernel);
    cv.morphologyEx(thresholded, thresholded, cv.MORPH_CLOSE, kernel);

    return this.findQuadFromBinaryMask(
      thresholded,
      width,
      height,
      approxEpsilonFraction,
      itemsToDelete,
      'adaptiveThreshold'
    );
  }

  /**
   * Simplifies a single contour down toward a 4-point quad (see
   * APPROX_EPSILON_RETRY_MULTIPLIERS's docs on the escalating-epsilon
   * retry) and accepts it only if it lands on exactly 4 points, covers
   * enough of the image, and doesn't touch the image border (see
   * touchesImageBorder's docs). Shared by both the outer-frame and
   * inner-edge candidate checks in findQuadFromBinaryMask below -
   * candidateLabel only affects debug-log text.
   */
  private static approximateContourToQuad(
    contour: cv.Mat,
    width: number,
    height: number,
    approxEpsilonFraction: number,
    minArea: number,
    itemsToDelete: EmscriptenEmbindInstance[],
    strategyLabel: string,
    candidateLabel: string
  ): Point[] | null {
    const perimeter = cv.arcLength(contour, true);
    let approxPoints: Point[] = [];
    for (const epsilonMultiplier of APPROX_EPSILON_RETRY_MULTIPLIERS) {
      const approx = new cv.Mat();
      itemsToDelete.push(approx);
      cv.approxPolyDP(
        contour,
        approx,
        approxEpsilonFraction * epsilonMultiplier * perimeter,
        true
      );
      approxPoints = this.matToPoints(approx);
      if (approxPoints.length <= 4) {
        break;
      }
    }
    const approxArea = polygonArea(approxPoints);
    const touchesBorder = touchesImageBorder(approxPoints, width, height);
    if (approxPoints.length === 4 && approxArea >= minArea && !touchesBorder) {
      debugLog(
        `>>>> findQuadFromBinaryMask (${strategyLabel}): ${candidateLabel} candidate accepted`,
        { approxPoints, approxArea }
      );
      return approxPoints;
    }
    debugLog(
      `>>>> findQuadFromBinaryMask (${strategyLabel}): ${candidateLabel} candidate rejected`,
      { pointCount: approxPoints.length, approxArea, minArea, touchesBorder }
    );
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
   *
   * Every contour Mat is deleted as soon as it's no longer needed (rather
   * than deferring all cleanup to detectQuad's top-level itemsToDelete):
   * contours outside the top MAX_CONTOURS_TO_TEST are freed immediately
   * after sorting, and each of the top candidates is freed right after its
   * approxPolyDP call, whether or not it turns out to be the accepted
   * result. A noisy photo can produce hundreds of contours, and holding
   * every one of their Mats alive until detectQuad finishes would mean
   * real, avoidable WASM heap pressure for the whole detection pass.
   */
  private static findQuadFromBinaryMask(
    binaryMask: cv.Mat,
    width: number,
    height: number,
    approxEpsilonFraction: number,
    itemsToDelete: EmscriptenEmbindInstance[],
    strategyLabel: string
  ): Point[] | null {
    const contours = new cv.MatVector();
    itemsToDelete.push(contours);
    const hierarchy = new cv.Mat();
    itemsToDelete.push(hierarchy);
    cv.findContours(
      binaryMask,
      contours,
      hierarchy,
      cv.RETR_CCOMP,
      cv.CHAIN_APPROX_SIMPLE
    );

    const contourCount = contours.size();
    debugLog(
      `>>>> findQuadFromBinaryMask (${strategyLabel}): contour count`,
      contourCount
    );
    if (contourCount === 0) {
      return null;
    }

    const minArea = MIN_DETECTED_AREA_FRACTION * width * height;
    const contoursByArea: { contour: cv.Mat; area: number; index: number }[] =
      [];
    for (let i = 0; i < contourCount; i++) {
      const contour = contours.get(i);
      contoursByArea.push({ contour, area: cv.contourArea(contour), index: i });
    }
    const sortedByAreaDescending = contoursByArea.sort(
      (a, b) => b.area - a.area
    );
    const largestFirst = sortedByAreaDescending.slice(0, MAX_CONTOURS_TO_TEST);

    // Free everything outside the top N right away - these were only ever
    // needed to compute their area for the sort above.
    for (const { contour } of sortedByAreaDescending.slice(
      MAX_CONTOURS_TO_TEST
    )) {
      contour.delete();
    }

    try {
      for (const { contour, area, index } of largestFirst) {
        if (area < minArea) {
          debugLog(
            `>>>> findQuadFromBinaryMask (${strategyLabel}): candidate rejected - area too small`,
            {
              area,
              minArea,
            }
          );
          continue;
        }

        const outerQuad = this.approximateContourToQuad(
          contour,
          width,
          height,
          approxEpsilonFraction,
          minArea,
          itemsToDelete,
          strategyLabel,
          'outer'
        );
        if (!outerQuad) {
          continue;
        }

        // hierarchy is Nx1, 4 channels per contour: [next, previous,
        // firstChild, parent] - see cv::findContours's own documentation
        // for this layout. -1 means "none".
        const firstChildIndex = hierarchy.data32S[index * 4 + 2];
        if (firstChildIndex !== -1) {
          const childContour = contours.get(firstChildIndex);
          const childArea = cv.contourArea(childContour);
          if (
            childArea >= minArea &&
            childArea >= MIN_INNER_TO_OUTER_AREA_RATIO * area
          ) {
            const innerQuad = this.approximateContourToQuad(
              childContour,
              width,
              height,
              approxEpsilonFraction,
              minArea,
              itemsToDelete,
              strategyLabel,
              'inner'
            );
            if (innerQuad) {
              debugLog(
                `>>>> findQuadFromBinaryMask (${strategyLabel}): preferring inner edge over outer frame`,
                { innerQuad, outerQuad }
              );
              childContour.delete();
              return innerQuad;
            }
          }
          childContour.delete();
        }

        return outerQuad;
      }

      return null;
    } finally {
      largestFirst.forEach(({ contour }) => contour.delete());
    }
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
    meanIntensitySource: cv.Mat,
    cannyInput: cv.Mat,
    width: number,
    height: number,
    cannySigma: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const meanIntensity = cv.mean(meanIntensitySource)[0];
    const lowerThreshold = Math.max(0, (1 - cannySigma) * meanIntensity);
    const upperThreshold = Math.min(255, (1 + cannySigma) * meanIntensity);

    const edges = new cv.Mat();
    itemsToDelete.push(edges);
    cv.Canny(cannyInput, edges, lowerThreshold, upperThreshold);

    const contours = new cv.MatVector();
    itemsToDelete.push(contours);
    const hierarchy = new cv.Mat();
    itemsToDelete.push(hierarchy);
    cv.findContours(
      edges,
      contours,
      hierarchy,
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE
    );

    const contourCount = contours.size();
    debugLog('>>>> findLargestContourBoundingBox: contour count', contourCount);
    if (contourCount === 0) {
      return null;
    }

    const minArea = MIN_DETECTED_AREA_FRACTION * width * height;

    let largestPoints: Point[] | null = null;
    let largestArea = 0;
    for (let i = 0; i < contourCount; i++) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > largestArea) {
        const points = this.matToPoints(contour);
        // Skip a contour tracing the image's own border - see
        // touchesImageBorder's docs.
        if (!touchesImageBorder(points, width, height)) {
          largestArea = area;
          largestPoints = points;
        }
      }
      contour.delete();
    }

    if (!largestPoints || largestArea < minArea) {
      debugLog('>>>> findLargestContourBoundingBox: no usable contour', {
        hasLargestPoints: !!largestPoints,
        largestArea,
        minArea,
      });
      return null;
    }

    debugLog('>>>> findLargestContourBoundingBox: accepted', {
      largestPoints,
      largestArea,
    });
    return boundingBoxToPoints(largestPoints);
  }

  /**
   * Reads a contour/polygon Mat (CV_32SC2, as produced by findContours and
   * approxPolyDP) into a plain array of points.
   */
  private static matToPoints(mat: cv.Mat): Point[] {
    const points: Point[] = [];
    for (let i = 0; i < mat.rows; i++) {
      points.push({
        x: mat.data32S[i * 2],
        y: mat.data32S[i * 2 + 1],
      });
    }
    return points;
  }
}
