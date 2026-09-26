// Imports Point directly from its own file (relative, not the @types
// alias - TypeScript reserves the "@types/" specifier prefix for
// DefinitelyTyped packages, so "@types/Point" doesn't resolve as a normal
// path-mapped import) rather than the @types barrel: CalibrationSample.ts
// (exported from that barrel) imports this file for DiagonalFeatures, so
// importing the barrel back here would close a require cycle (same class
// of issue the services barrel had - see usePersistedSettingsStore.ts's
// docs).
import { Point } from '../types/Point';
import { orderPointsByCorner } from '@utils/transformUtils';

/**
 * Minimum fraction of the total image area a detected quad/contour must
 * cover to be accepted as "the frame" rather than noise or an unrelated
 * small object in the scene. Fixed rather than user/calibration-tunable:
 * nothing about the right cutoff here varies meaningfully photo to photo
 * or benefits from precise tuning - it only needs to be generous enough to
 * reject obviously-implausible tiny candidates fast.
 */
export const MIN_DETECTED_AREA_FRACTION = 0.05;

/**
 * How many of the largest contours (by area) to test with approxPolyDP
 * before giving up on a detection pass. Bounded so a photo with lots of
 * texture/noise (producing hundreds of tiny contours) doesn't cost
 * unbounded approxPolyDP calls.
 *
 * Raised from 5: cv.contourArea ranks purely by a contour's raw enclosed
 * area, regardless of how well-formed it is - a large, badly-broken
 * contour (e.g. one that later collapses to a degenerate 2-3 point sliver
 * under approxPolyDP) can easily out-rank a smaller but genuinely clean,
 * rectangular candidate (like a high-contrast painting boundary sitting
 * inside a low-contrast frame) purely on size. A photo observed producing
 * exactly this: a real, clean inner-edge candidate never got tested at
 * all because larger-but-junk contours filled every one of the top 5
 * slots first. Testing more candidates is cheap relative to the Canny/
 * findContours pass itself - it's just a few more approxPolyDP calls.
 */
export const MAX_CONTOURS_TO_TEST = 15;

/**
 * Maximum working dimension (longer side, in pixels) the web detection
 * pipeline (DetectionService.ts) runs against. Web-only: @techstark/opencv-js's
 * WASM build has a fixed heap ceiling, and running the pipeline at full
 * photo resolution (12MP+ is now typical) can allocate enough simultaneous
 * cv.Mat buffers to exceed it - which crashes the whole browser tab rather
 * than throwing a catchable error. Detection doesn't need full resolution
 * to find a quad's rough shape, so the image is downscaled to this before
 * any OpenCV call. Native (DetectionService.native.ts) has no equivalent
 * fixed-heap constraint and is intentionally left at full resolution.
 */
export const MAX_DETECTION_DIMENSION = 1600;

/**
 * Default Canny edge-sensitivity parameter, used as
 * `lower = (1 - sigma) * meanIntensity`, `upper = (1 + sigma) * meanIntensity`
 * (the standard "auto-Canny" heuristic, thresholding relative to the
 * image's own brightness rather than fixed absolute values, since gallery
 * lighting varies a lot photo to photo). This is one of the two thresholds
 * that actually determines whether the frame's edges get detected at all -
 * too low and low-contrast frames produce no usable edges, too high and
 * background texture gets picked up as noise. User-tunable via Settings.
 */
export const DEFAULT_CANNY_SIGMA = 0.33;

/**
 * Default approxPolyDP epsilon, as a fraction of the candidate contour's
 * perimeter. This is the other threshold that actually determines
 * detection quality: it controls how aggressively a rough, noisy contour
 * gets simplified down to a 4-point quad. Too small and an ornate or
 * slightly-wavy real frame outline never simplifies to exactly 4 points
 * (silently rejected); too large and it can simplify away real corners.
 * User-tunable via Settings.
 */
export const DEFAULT_APPROX_EPSILON_FRACTION = 0.02;

/**
 * Multipliers applied to a candidate contour's epsilon fraction when its
 * first approxPolyDP pass doesn't land on exactly 4 points - see
 * findQuadFromBinaryMask's docs. A larger epsilon simplifies more
 * aggressively (removes more vertices), so this only ever needs to grow;
 * the search stops as soon as a pass lands at or below 4 points.
 */
export const APPROX_EPSILON_RETRY_MULTIPLIERS = [1, 2, 4, 8];

/**
 * Minimum fraction of a validated outer frame candidate's own area that its
 * direct-child (hole) contour must cover to be considered a plausible inner
 * painting boundary, rather than some unrelated small internal feature that
 * happens to be a direct child. Only the outer candidate's immediate child
 * is ever considered in the first place (see findQuadFromBinaryMask) - a
 * shape drawn within the painting itself would be a grandchild or deeper,
 * so it's structurally ineligible regardless of this ratio. This is a
 * secondary sanity check on top of that, not the primary safeguard.
 */
export const MIN_INNER_TO_OUTER_AREA_RATIO = 0.4;

/**
 * Default shadow-removal background-estimate kernel size, as a fraction of
 * the image's diagonal (resolution-independent, same reasoning as
 * DEFAULT_APPROX_EPSILON_FRACTION being a fraction of perimeter rather
 * than a fixed pixel count) - see computeShadowRemovalKernelSize's docs
 * for how this becomes an actual pixel kernel. A first-pass guess, not a
 * value derived from real photos: there's no calibration data for this
 * step yet, so it's meant to be revisited once shadowRemovalEnabled has
 * been tested against real gallery photos with visible shadows.
 */
export const DEFAULT_SHADOW_REMOVAL_KERNEL_FRACTION = 0.02;

/**
 * Converts a fraction-of-diagonal kernel size (see
 * DEFAULT_SHADOW_REMOVAL_KERNEL_FRACTION) into an actual odd pixel size for
 * the morphological structuring element used to estimate the background/
 * illumination field (see DetectionService's removeShadowsForDetection).
 * Clamped to a minimum of 3 so a tiny working resolution never produces a
 * degenerate (0 or negative) kernel.
 */
export const computeShadowRemovalKernelSize = (
  width: number,
  height: number,
  kernelFraction: number
): number => {
  const diagonal = Math.sqrt(width * width + height * height);
  const rawSize = Math.max(3, Math.round(kernelFraction * diagonal));
  return rawSize % 2 === 0 ? rawSize + 1 : rawSize;
};

/**
 * Candidate Canny edge-sensitivity values to test. A coarse grid, not a
 * continuous search - useful both as a manual tuning aid (the local
 * calibration sweep, see useCalibrationSweep) and as the candidate set a
 * verified learned-threshold model picks from per photo (see
 * predictThresholdsFromFeatures) - evaluating a tiny tree ensemble against
 * 9 combinations is cheap, unlike the sweep's 9 real OpenCV detection
 * passes. This is one of the two thresholds that actually determines
 * whether the frame's edges get detected at all (see DEFAULT_CANNY_SIGMA's
 * docs).
 */
export const CANNY_SIGMA_CANDIDATES = [0.2, 0.33, 0.45];

/**
 * Candidate approxPolyDP epsilon-fraction values to test - the other
 * threshold that actually determines detection quality (see
 * DEFAULT_APPROX_EPSILON_FRACTION's docs).
 */
export const APPROX_EPSILON_CANDIDATES = [0.01, 0.02, 0.04];

/**
 * The detection thresholds DetectionService.detectQuad accepts an optional
 * override for - see its `thresholdOverrides` parameter. Used by the
 * calibration sweep (useCalibrationSweep) to test many combinations against
 * saved samples without mutating the live persisted settings the rest of
 * the app reads. Area-fraction bounds aren't here: the minimum is a fixed
 * sanity cutoff (see MIN_DETECTED_AREA_FRACTION) and the maximum was
 * retired once touchesImageBorder took over its one real job more
 * precisely - neither varies photo to photo or benefits from tuning.
 * @property cannySigma - Canny edge-sensitivity parameter (see DEFAULT_CANNY_SIGMA)
 * @property approxEpsilonFraction - approxPolyDP simplification aggressiveness
 * (see DEFAULT_APPROX_EPSILON_FRACTION)
 * @property detectionStrategy - Which detection strategy to force for this
 * call, overriding PersistedSettings.lineSegmentDetectionEnabled the same
 * way cannySigma/approxEpsilonFraction override the persisted thresholds -
 * lets the calibration sweep run both strategies against saved samples for
 * a head-to-head comparison without touching real settings. Omitted means
 * "use whatever the persisted setting says", matching every real app call
 * site's existing behavior unchanged. Ignored (cannySigma/
 * approxEpsilonFraction have no effect) when set to 'lineSegment', since
 * that strategy has no equivalent tunable thresholds.
 */
export type DetectionThresholds = {
  cannySigma: number;
  approxEpsilonFraction: number;
  detectionStrategy?: 'contour' | 'lineSegment';
};

/**
 * How many samples to take along each corner-to-center ray in
 * computeAdaptiveCannySigma. The image this runs against has already been
 * Gaussian-blurred (see DetectionService's detectQuad), which suppresses
 * single-pixel noise, so this only needs enough resolution to not step over
 * a thin frame edge entirely - not pixel-by-pixel precision.
 */
const DIAGONAL_SAMPLE_COUNT = 60;

/**
 * The lowest and highest Canny sigma computeAdaptiveCannySigma can produce.
 * Matches (and slightly widens, on the loose end) the range the retired
 * manual calibration sweep explored for its CANNY_SIGMA_CANDIDATES, so a
 * computed value never pushes Canny into threshold territory that hasn't
 * already been sanity-checked against real photos.
 */
const MIN_ADAPTIVE_SIGMA = 0.2;
const MAX_ADAPTIVE_SIGMA = 0.6;

/**
 * A pixel-intensity jump at or above this magnitude (0-255 scale) is
 * treated as "a clearly-defined edge" - beyond this point, more contrast
 * doesn't justify tightening sigma any further. This is a first-pass
 * estimate (roughly a third of the full 0-255 range), not a value derived
 * from data - it's meant to be revisited once there's a real spread of
 * calibration photos to check it against.
 */
const STRONG_EDGE_CONTRAST = 80;

/**
 * The numeric feature vector describing one photo for calibration purposes
 * - see computeDiagonalFeatures. Field order/naming must stay in sync with
 * the calibration API's CalibrationSampleRecord (services/CalibrationApi/
 * Models/CalibrationSampleRecord.cs), which trains on exactly these
 * columns; nothing here is enforced across that language boundary except
 * by convention, so a field added/renamed on one side needs the same
 * change on the other.
 *
 * Rays are numbered in the same fixed order computeDiagonalFeatures always
 * samples them in: 0 = top-left, 1 = top-right, 2 = bottom-left, 3 =
 * bottom-right, each running from that corner to the image's center.
 * @property ray0JumpMagnitude - Sharpest pixel-intensity jump found along
 * the top-left-to-center ray (0-255)
 * @property ray0JumpLocation - How far along that ray the jump occurred (0
 * = at the corner, 1 = at the center) - a rough proxy for how large the
 * frame is relative to the photo
 * @property aspectRatio - The photo's width divided by its height
 * @property meanIntensity - Average grayscale intensity across all sampled
 * points (a cheap proxy for overall photo brightness)
 * @property intensityStdDev - Standard deviation of grayscale intensity
 * across all sampled points (a cheap proxy for overall contrast/exposure
 * spread)
 */
export type DiagonalFeatures = {
  ray0JumpMagnitude: number;
  ray0JumpLocation: number;
  ray1JumpMagnitude: number;
  ray1JumpLocation: number;
  ray2JumpMagnitude: number;
  ray2JumpLocation: number;
  ray3JumpMagnitude: number;
  ray3JumpLocation: number;
  aspectRatio: number;
  meanIntensity: number;
  intensityStdDev: number;
};

/**
 * Samples pixel intensity along a ray from each of the image's 4 corners to
 * its center - a real frame in a typical photo sits somewhere between the
 * background-filled corners and the center, so each ray should cross the
 * frame's edge once - and reduces each ray to its sharpest jump (magnitude
 * and where along the ray it happened), plus a couple of whole-photo
 * brightness/contrast stats from the same sampled points. This is the raw
 * material both computeAdaptiveCannySigma's live heuristic and the
 * calibration API's learned model are built from; see DiagonalFeatures'
 * docs for what each field means and why per-ray (not just a single
 * global figure) and jump *location* (not just magnitude) are kept.
 *
 * @param getPixel - Returns the grayscale intensity (0-255) at a pixel
 * coordinate - backed by cv.Mat.data on web, OpenCV.matToBuffer on native
 * @param width - The sampled image's width in pixels
 * @param height - The sampled image's height in pixels
 * @returns The photo's diagonal feature vector
 *
 * @example
 * ```typescript
 * const features = computeDiagonalFeatures(
 *   (x, y) => blurred.data[y * blurred.cols + x],
 *   width,
 *   height
 * );
 * ```
 */
export const computeDiagonalFeatures = (
  getPixel: (x: number, y: number) => number,
  width: number,
  height: number
): DiagonalFeatures => {
  const centerX = width / 2;
  const centerY = height / 2;
  const corners: Point[] = [
    { x: 0, y: 0 }, // ray 0: top-left
    { x: width - 1, y: 0 }, // ray 1: top-right
    { x: 0, y: height - 1 }, // ray 2: bottom-left
    { x: width - 1, y: height - 1 }, // ray 3: bottom-right
  ];

  const sampledValues: number[] = [];
  const rays = corners.map((corner) => {
    let previousValue = getPixel(corner.x, corner.y);
    sampledValues.push(previousValue);

    let jumpMagnitude = 0;
    let jumpLocation = 0;
    for (let step = 1; step <= DIAGONAL_SAMPLE_COUNT; step++) {
      const t = step / DIAGONAL_SAMPLE_COUNT;
      const x = Math.round(corner.x + (centerX - corner.x) * t);
      const y = Math.round(corner.y + (centerY - corner.y) * t);
      const value = getPixel(x, y);
      sampledValues.push(value);

      const jump = Math.abs(value - previousValue);
      if (jump > jumpMagnitude) {
        jumpMagnitude = jump;
        jumpLocation = t;
      }
      previousValue = value;
    }
    return { jumpMagnitude, jumpLocation };
  });

  const meanIntensity =
    sampledValues.reduce((sum, value) => sum + value, 0) / sampledValues.length;
  const variance =
    sampledValues.reduce(
      (sum, value) => sum + (value - meanIntensity) ** 2,
      0
    ) / sampledValues.length;

  return {
    ray0JumpMagnitude: rays[0].jumpMagnitude,
    ray0JumpLocation: rays[0].jumpLocation,
    ray1JumpMagnitude: rays[1].jumpMagnitude,
    ray1JumpLocation: rays[1].jumpLocation,
    ray2JumpMagnitude: rays[2].jumpMagnitude,
    ray2JumpLocation: rays[2].jumpLocation,
    ray3JumpMagnitude: rays[3].jumpMagnitude,
    ray3JumpLocation: rays[3].jumpLocation,
    aspectRatio: width / height,
    meanIntensity,
    intensityStdDev: Math.sqrt(variance),
  };
};

/**
 * Estimates a per-image Canny sigma (see DEFAULT_CANNY_SIGMA) by directly
 * measuring how sharp the frame's actual edge is in this photo, rather than
 * using one fixed sigma for every photo regardless of its contrast. A thin
 * wrapper over computeDiagonalFeatures: takes the strongest of its 4 rays'
 * jump magnitudes as "how strong is this photo's real edge". A weak jump
 * (a light frame on a similarly light wall) widens sigma so Canny's lower
 * threshold doesn't sit above the edge's actual strength; a strong jump (a
 * dark frame on a light wall) narrows it, since the edge will clear a
 * stricter threshold anyway and a tighter band rejects more background
 * texture as noise.
 *
 * @param getPixel - Returns the grayscale intensity (0-255) at a pixel
 * coordinate - backed by cv.Mat.data on web, OpenCV.matToBuffer on native
 * @param width - The sampled image's width in pixels
 * @param height - The sampled image's height in pixels
 * @returns A Canny sigma between MIN_ADAPTIVE_SIGMA and MAX_ADAPTIVE_SIGMA
 *
 * @example
 * ```typescript
 * const sigma = computeAdaptiveCannySigma(
 *   (x, y) => blurred.data[y * blurred.cols + x],
 *   width,
 *   height
 * );
 * ```
 */
export const computeAdaptiveCannySigma = (
  getPixel: (x: number, y: number) => number,
  width: number,
  height: number
): number => {
  const features = computeDiagonalFeatures(getPixel, width, height);
  const maxJump = Math.max(
    features.ray0JumpMagnitude,
    features.ray1JumpMagnitude,
    features.ray2JumpMagnitude,
    features.ray3JumpMagnitude
  );

  const contrastFraction = Math.min(1, maxJump / STRONG_EDGE_CONTRAST);
  return (
    MAX_ADAPTIVE_SIGMA -
    contrastFraction * (MAX_ADAPTIVE_SIGMA - MIN_ADAPTIVE_SIGMA)
  );
};

/**
 * Fraction of the image's smaller dimension used as the "too close to the
 * edge" margin for touchesImageBorder. Ported from the original Python
 * prototype (straighten_up_python's analyse.py), which rejected any
 * contour with a point within a fixed 10px of the image border - expressed
 * here as a fraction rather than a fixed pixel count so it scales sensibly
 * across the wide range of resolutions modern phone photos actually come
 * in (10px means something very different on a 640px image vs a 4000px
 * one).
 */
export const BORDER_TOUCH_MARGIN_FRACTION = 0.02;

/**
 * Whether every point in a contour/polygon comes within the border margin
 * of the image's edges - i.e. whether the whole candidate is tracing the
 * photo's own outline, not just passing near it at one corner. A real
 * frame in a photo almost always has some visible background around it;
 * a contour that traces the image border on all sides is far more likely
 * to be an artifact of the image's own boundary - Canny followed by dilate
 * reliably produces a clean edge right at the image's own border, which
 * findContours then reports as a single near-100%-area contour that is
 * already a rectangle, beating the real target on both area and
 * approxPolyDP's 4-point test - than an actual photographed object.
 * Requiring every point (not just one) matters because a real, correctly
 * detected frame can legitimately have a single corner sitting close to
 * the edge of the shot (a tight crop, or just how the photo was framed) -
 * rejecting on one point alone would throw out a genuinely correct
 * detection for looking similar to a border-trace artifact it isn't.
 *
 * @param points - The candidate contour/polygon's vertices, in absolute
 * pixel coordinates
 * @param width - The source image's width in pixels
 * @param height - The source image's height in pixels
 * @param marginFraction - The margin, as a fraction of the smaller image
 * dimension - defaults to BORDER_TOUCH_MARGIN_FRACTION
 * @returns Whether every point in the set touches (or crosses) the border margin
 */
export const touchesImageBorder = (
  points: Point[],
  width: number,
  height: number,
  marginFraction: number = BORDER_TOUCH_MARGIN_FRACTION
): boolean => {
  const margin = marginFraction * Math.min(width, height);
  return points.every(
    ({ x, y }) =>
      x <= margin || x >= width - margin || y <= margin || y >= height - margin
  );
};

/**
 * Computes the axis-aligned bounding box of an arbitrary point set and
 * returns it as 4 corner points in Corner-enum order (top-left, top-right,
 * bottom-right, bottom-left). Used as the least-precise fallback in the
 * detection pipeline: when no contour approximates cleanly to a
 * quadrilateral, the bounding box of the single largest contour still gives
 * a reasonable starting rectangle for the user to adjust, better than
 * leaving them with the generic centered default.
 *
 * @param points - Arbitrary set of 2D points (e.g. a contour), in absolute
 * pixel coordinates
 * @returns 4 corner points of the bounding box, in absolute pixel coordinates
 */
export const boundingBoxToPoints = (points: Point[]): Point[] => {
  if (points.length === 0) {
    throw new Error('Cannot compute a bounding box of an empty point set');
  }

  // A single pass rather than Math.min/max(...points) - spreading a large
  // contour's points (a real photo's noisiest contours can easily have
  // thousands) risks exceeding JS engines' function-argument-count limits.
  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  for (const { x, y } of points) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }

  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ];
};

/**
 * Converts absolute pixel-coordinate points to relative (0-1) coordinates,
 * and orders them by corner - the format useOverlayStore.setPoints expects.
 *
 * @param points - Exactly 4 points in absolute pixel coordinates
 * @param imageWidth - The source image's width in pixels
 * @param imageHeight - The source image's height in pixels
 * @returns 4 points in relative (0-1) coordinates, ordered by corner
 */
export const toOrderedRelativePoints = (
  points: Point[],
  imageWidth: number,
  imageHeight: number
): Point[] => {
  if (imageWidth <= 0 || imageHeight <= 0) {
    // e.g. ImageSource.dimensions still at DefaultSourceImage's 0x0 - dividing
    // by these would silently produce Infinity/NaN points. Fail loudly so
    // callers (DetectionService.detectQuad) fall back to initialPoints
    // instead of committing garbage overlay points.
    throw new Error(
      `Cannot convert points to relative coordinates for a ${imageWidth}x${imageHeight} image`
    );
  }

  const relativePoints = points.map((p) => ({
    x: p.x / imageWidth,
    y: p.y / imageHeight,
  }));
  return orderPointsByCorner(relativePoints);
};

/**
 * Computes the (unsigned) area of a closed polygon via the shoelace formula.
 *
 * @param points - The polygon's vertices, in order
 * @returns The polygon's area in the same squared units as the input points
 */
export const polygonArea = (points: Point[]): number => {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const current = points[i];
    const next = points[(i + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }
  return Math.abs(area) / 2;
};

/**
 * Whether a point lies on the interior side of a directed edge (from ->
 * to), for a CLOCKWISE-wound polygon in a y-down coordinate system (as this
 * app's overlay/detection points always are - see orderPointsByCorner).
 * Used by clipConvexPolygon's Sutherland-Hodgman edge walk.
 */
const isInsideEdge = (point: Point, from: Point, to: Point): boolean => {
  return (
    (to.x - from.x) * (point.y - from.y) -
      (to.y - from.y) * (point.x - from.x) >=
    0
  );
};

/** Where a line segment (from -> to) crosses a directed clip edge (from -> to). */
const intersectEdge = (
  segmentStart: Point,
  segmentEnd: Point,
  edgeFrom: Point,
  edgeTo: Point
): Point => {
  const edgeDx = edgeTo.x - edgeFrom.x;
  const edgeDy = edgeTo.y - edgeFrom.y;
  const segmentDx = segmentEnd.x - segmentStart.x;
  const segmentDy = segmentEnd.y - segmentStart.y;

  const denominator = segmentDx * edgeDy - segmentDy * edgeDx;
  const t =
    ((segmentStart.y - edgeFrom.y) * edgeDx -
      (segmentStart.x - edgeFrom.x) * edgeDy) /
    denominator;

  return {
    x: segmentStart.x + t * segmentDx,
    y: segmentStart.y + t * segmentDy,
  };
};

/**
 * Clips a subject polygon against a convex clip polygon via the
 * Sutherland-Hodgman algorithm, returning their intersection (possibly
 * empty, if they don't overlap at all).
 *
 * @param subject - The polygon being clipped - may be any simple polygon
 * @param clip - The clipping polygon - must be convex (every quad this app
 * produces, whether hand-placed or detected, satisfies this)
 * @returns The intersection polygon's vertices, or [] if there's no overlap
 */
const clipConvexPolygon = (subject: Point[], clip: Point[]): Point[] => {
  let output = subject;

  for (let i = 0; i < clip.length; i++) {
    const edgeFrom = clip[i];
    const edgeTo = clip[(i + 1) % clip.length];
    const input = output;
    output = [];

    if (input.length === 0) {
      break;
    }

    for (let j = 0; j < input.length; j++) {
      const current = input[j];
      const previous = input[(j - 1 + input.length) % input.length];
      const currentInside = isInsideEdge(current, edgeFrom, edgeTo);
      const previousInside = isInsideEdge(previous, edgeFrom, edgeTo);

      if (currentInside) {
        if (!previousInside) {
          output.push(intersectEdge(previous, current, edgeFrom, edgeTo));
        }
        output.push(current);
      } else if (previousInside) {
        output.push(intersectEdge(previous, current, edgeFrom, edgeTo));
      }
    }
  }

  return output;
};

/**
 * Computes the Intersection-over-Union of two convex quads (or any convex
 * polygons) - the standard accuracy metric for comparing a detected quad
 * against its ground-truth counterpart: 1.0 for a perfect match, 0.0 for no
 * overlap at all. Used by the calibration sweep to score threshold
 * combinations against saved ground-truth samples.
 *
 * @param a - First polygon's vertices
 * @param b - Second polygon's vertices - must be convex (see clipConvexPolygon)
 * @returns The IoU score, from 0 (no overlap) to 1 (identical)
 */
export const computePolygonIoU = (a: Point[], b: Point[]): number => {
  const intersection = clipConvexPolygon(a, b);
  const intersectionArea = polygonArea(intersection);
  const unionArea = polygonArea(a) + polygonArea(b) - intersectionArea;

  if (unionArea === 0) {
    return 0;
  }

  return intersectionArea / unionArea;
};

// ---------------------------------------------------------------------------
// Line-segment-based detection (alternate strategy, internal/dev-only toggle
// - see PersistedSettings.lineSegmentDetectionEnabled's docs). Everything
// below is pure geometry over plain points/numbers, with no OpenCV
// dependency, so both DetectionService.ts (web) and DetectionService.native.ts
// share this exact code and only differ in how they detect raw line
// segments (HoughLinesP) and sample edge pixels (Mat access) before/after
// calling into it. This mirrors the rest of this file's existing
// pixel-accessor-callback convention (see computeDiagonalFeatures) rather
// than taking OpenCV Mats directly.
// ---------------------------------------------------------------------------

/** A raw straight-line segment, as returned by HoughLinesP on either platform. */
export type LineSegment = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

/**
 * A line fit through a point set, in point-plus-unit-direction form
 * (matches cv.fitLine's own 2D output convention: vx,vy,x0,y0). `weight` is
 * the total length of the segments that contributed to this fit, used to
 * rank lines by how much real evidence supports them. `points` retains the
 * raw contributing endpoints (at whatever resolution the fit was computed
 * at) so a later step can re-fit the same line more precisely against
 * full-resolution data - see refitLineFromInliers.
 */
export type FittedLine = {
  vx: number;
  vy: number;
  x0: number;
  y0: number;
  weight: number;
  points: Point[];
};

/** A candidate quadrilateral formed by intersecting two pairs of fitted lines. */
export type QuadCandidate = {
  points: Point[];
  lineA1: FittedLine;
  lineA2: FittedLine;
  lineB1: FittedLine;
  lineB2: FittedLine;
};

export type QuadCandidateScore = {
  edgeSupport: number;
  nestedParallelSupport: number;
  vanishingPointConsistency: number;
  geometry: number;
  overall: number;
};

export type LineSegmentDetectionResult = {
  points: Point[];
  confidence: number;
  scoreBreakdown: QuadCandidateScore;
  contributingLines: [FittedLine, FittedLine, FittedLine, FittedLine];
};

/**
 * Segments shorter than this fraction of the image diagonal are dropped
 * before merging - HoughLinesP on a noisy/textured photo can return many
 * very short, low-evidence segments that would otherwise dilute merged
 * lines' fitted direction. A first-pass estimate, meant to be tuned once
 * there's real data comparing this strategy against the contour-based one.
 */
export const MIN_LINE_SEGMENT_LENGTH_FRACTION = 0.03;

/**
 * Maximum angle difference (radians) for two segments to be considered
 * part of the same real line during merging.
 */
export const LINE_MERGE_ANGLE_TOLERANCE_RADIANS = (5 * Math.PI) / 180;

/**
 * Maximum perpendicular distance (as a fraction of image diagonal) from a
 * candidate segment's endpoints to a merge group's current fitted line.
 */
export const LINE_MERGE_DISTANCE_FRACTION = 0.01;

/**
 * Maximum along-line gap (as a fraction of image diagonal) between a merge
 * group's current extent and a candidate segment's projected interval -
 * prevents merging two genuinely separate parallel edges (e.g. a frame's
 * top edge and an unrelated shelf edge above it) purely because they share
 * an angle and offset.
 */
export const LINE_MERGE_GAP_FRACTION = 0.08;

/**
 * How many of the strongest (by weight) merged lines to consider when
 * generating quad candidates. Bounded for combinatorial tractability -
 * generateQuadCandidates tests every pair-of-pairs among family members, so
 * this needs to stay small enough to keep that fast.
 */
export const MAX_RANKED_LINES_FOR_CANDIDATES = 40;

/**
 * Orientation-family membership tolerance (radians) - deliberately wide and
 * overlapping rather than a rigid single-assignment partition. A rigid
 * 2-cluster split silently assumes opposite sides stay angularly
 * well-separated from adjacent sides, which is reasonable for a mild tilt
 * but fragile for the steep, close, wide-angle shots this app specifically
 * exists to correct (perspective convergence can narrow that separation).
 * A line within this tolerance of *either* dominant orientation is
 * included in that family - a line near the boundary between the two
 * families gets a chance to be tried in both roles instead of being
 * irrevocably misassigned to one.
 */
export const ORIENTATION_FAMILY_ANGLE_TOLERANCE_RADIANS = (40 * Math.PI) / 180;

/**
 * Below this angle difference (radians), two candidate "opposite" lines are
 * treated as parallel for vanishing-point scoring rather than requiring
 * their intersection to be checked for plausibility.
 */
export const VANISHING_POINT_PARALLEL_ANGLE_TOLERANCE_RADIANS =
  (3 * Math.PI) / 180;

/**
 * Outlier-rejection threshold for the full-resolution robust re-fit, as a
 * multiple of the median absolute deviation (MAD) of perpendicular
 * residuals - a standard robust-statistics default or a "typical" candidate
 * to reject that clearly clearly doesn't belong to that side's line.
 */
export const REFIT_OUTLIER_MAD_MULTIPLIER = 2.5;

/**
 * Weights for combining a quad candidate's individual scores into one
 * overall score (see scoreQuadCandidate). First-pass estimates, not values
 * derived from data - meant to be revisited once there are real photos to
 * compare this strategy's results against the contour-based one on.
 * Edge support gets the largest weight since it's the most direct evidence
 * a candidate's sides are real; geometry/area is a soft prior, not a hard
 * gate (hard area bounds are already enforced during candidate generation).
 */
const QUAD_SCORE_EDGE_SUPPORT_WEIGHT = 0.45;
const QUAD_SCORE_NESTED_PARALLEL_WEIGHT = 0.25;
const QUAD_SCORE_VANISHING_POINT_WEIGHT = 0.1;
const QUAD_SCORE_GEOMETRY_WEIGHT = 0.2;

/**
 * Normalizes an angle to [0, π) - a line has no inherent direction (a
 * segment from A to B represents the same line as one from B to A), so
 * angle and angle+π must be treated as identical throughout this module.
 */
const normalizeLineAngle = (angle: number): number => {
  let normalized = angle % Math.PI;
  if (normalized < 0) {
    normalized += Math.PI;
  }
  return normalized;
};

/** Smallest difference between two already-normalized [0, π) line angles. */
const lineAngleDifference = (a: number, b: number): number => {
  const diff = Math.abs(a - b);
  return Math.min(diff, Math.PI - diff);
};

const angleOfLine = (line: Pick<FittedLine, 'vx' | 'vy'>): number =>
  normalizeLineAngle(Math.atan2(line.vy, line.vx));

/**
 * Fits a 2D line through a point set by total least squares (minimizing
 * perpendicular, not vertical, distance) - the direction of maximum
 * variance of the point set, found via the closed-form solution for the
 * principal axis of a 2x2 scatter matrix. Deliberately not cv.fitLine: this
 * keeps line-fitting logic identical and fully platform-agnostic (no Mat
 * marshaling, no per-platform fitLine parameter differences to keep in
 * sync) at the cost of only supporting an ordinary least-squares fit
 * (matching cv.fitLine's own default DIST_L2 behavior) rather than
 * fitLine's other, more exotic M-estimator distance types - not needed
 * here since outlier rejection is handled separately (see
 * refitLineFromInliers).
 */
const fitLineToPoints = (
  points: Point[]
): Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'> => {
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const meanY = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  let sxx = 0;
  let syy = 0;
  let sxy = 0;
  for (const point of points) {
    const dx = point.x - meanX;
    const dy = point.y - meanY;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }

  const angle = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  return { vx: Math.cos(angle), vy: Math.sin(angle), x0: meanX, y0: meanY };
};

/** Perpendicular distance from a point to an infinite line (vx,vy unit direction, through x0,y0). */
const perpendicularDistanceToLine = (
  point: Point,
  line: Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'>
): number => {
  const dx = point.x - line.x0;
  const dy = point.y - line.y0;
  return Math.abs(dx * line.vy - dy * line.vx);
};

/** Signed projection of a point onto a line's direction, relative to the line's own reference point. */
const projectOntoLine = (
  point: Point,
  line: Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'>
): number => (point.x - line.x0) * line.vx + (point.y - line.y0) * line.vy;

/**
 * Groups raw line segments into merged real lines via greedy iterative
 * merging: the longest remaining segment seeds a group, every compatible
 * remaining segment (similar angle, close perpendicular distance, and not
 * an isolated gap away along the line) joins it, the group's line is
 * refit after each merge (a segment merged late can bring the fitted angle
 * close enough for another not-yet-compatible segment to now qualify), and
 * the process repeats with whatever segments remain unmerged.
 */
export const mergeCollinearSegments = (
  segments: LineSegment[],
  width: number,
  height: number
): FittedLine[] => {
  const diagonal = Math.hypot(width, height);
  const minLength = MIN_LINE_SEGMENT_LENGTH_FRACTION * diagonal;
  const distanceTolerance = LINE_MERGE_DISTANCE_FRACTION * diagonal;
  const gapTolerance = LINE_MERGE_GAP_FRACTION * diagonal;

  const candidates = segments
    .map((segment) => ({
      ...segment,
      angle: normalizeLineAngle(
        Math.atan2(segment.y2 - segment.y1, segment.x2 - segment.x1)
      ),
      length: Math.hypot(segment.x2 - segment.x1, segment.y2 - segment.y1),
    }))
    .filter((segment) => segment.length >= minLength)
    .sort((a, b) => b.length - a.length);

  const used = new Array(candidates.length).fill(false);
  const groups: FittedLine[] = [];

  for (let seedIndex = 0; seedIndex < candidates.length; seedIndex++) {
    if (used[seedIndex]) {
      continue;
    }
    used[seedIndex] = true;
    const seed = candidates[seedIndex];
    let points: Point[] = [
      { x: seed.x1, y: seed.y1 },
      { x: seed.x2, y: seed.y2 },
    ];
    let line = fitLineToPoints(points);
    let totalLength = seed.length;

    let mergedInPass = true;
    while (mergedInPass) {
      mergedInPass = false;
      const lineAngle = angleOfLine(line);
      const projections = points.map((p) => projectOntoLine(p, line));
      let groupMin = Math.min(...projections);
      let groupMax = Math.max(...projections);

      for (let i = 0; i < candidates.length; i++) {
        if (used[i]) {
          continue;
        }
        const candidate = candidates[i];
        if (
          lineAngleDifference(candidate.angle, lineAngle) >
          LINE_MERGE_ANGLE_TOLERANCE_RADIANS
        ) {
          continue;
        }
        const p1 = { x: candidate.x1, y: candidate.y1 };
        const p2 = { x: candidate.x2, y: candidate.y2 };
        if (
          perpendicularDistanceToLine(p1, line) > distanceTolerance ||
          perpendicularDistanceToLine(p2, line) > distanceTolerance
        ) {
          continue;
        }
        const proj1 = projectOntoLine(p1, line);
        const proj2 = projectOntoLine(p2, line);
        const candidateMin = Math.min(proj1, proj2);
        const candidateMax = Math.max(proj1, proj2);
        const gap = Math.max(
          groupMin - candidateMax,
          candidateMin - groupMax,
          0
        );
        if (gap > gapTolerance) {
          continue;
        }

        points = [...points, p1, p2];
        totalLength += candidate.length;
        used[i] = true;
        mergedInPass = true;
        groupMin = Math.min(groupMin, candidateMin);
        groupMax = Math.max(groupMax, candidateMax);
      }

      if (mergedInPass) {
        line = fitLineToPoints(points);
      }
    }

    groups.push({ ...line, weight: totalLength, points });
  }

  return groups;
};

/**
 * Splits merged lines into two overlapping orientation families via
 * weighted circular k-means (k=2). Angles are represented doubled
 * (2*theta, as a point on the unit circle) so that lines near the 0/π
 * wraparound cluster correctly - a standard technique for clustering axial
 * (undirected line) data rather than directional (vector) data. See
 * ORIENTATION_FAMILY_ANGLE_TOLERANCE_RADIANS's docs on why membership is
 * soft/overlapping rather than a strict partition.
 */
export const clusterOrientations = (
  lines: FittedLine[]
): { familyA: FittedLine[]; familyB: FittedLine[] } => {
  if (lines.length === 0) {
    return { familyA: [], familyB: [] };
  }

  const doubledAngleVector = (line: FittedLine): Point => {
    const angle = angleOfLine(line);
    return { x: Math.cos(2 * angle), y: Math.sin(2 * angle) };
  };

  const sortedByWeight = [...lines].sort((a, b) => b.weight - a.weight);
  let centerA = doubledAngleVector(sortedByWeight[0]);
  let centerB = centerA;
  for (const line of sortedByWeight) {
    const candidateVector = doubledAngleVector(line);
    const distanceFromA = Math.hypot(
      candidateVector.x - centerA.x,
      candidateVector.y - centerA.y
    );
    const currentBDistance = Math.hypot(
      centerB.x - centerA.x,
      centerB.y - centerA.y
    );
    if (distanceFromA > currentBDistance) {
      centerB = candidateVector;
    }
  }

  const ORIENTATION_CLUSTER_ITERATIONS = 6;
  for (
    let iteration = 0;
    iteration < ORIENTATION_CLUSTER_ITERATIONS;
    iteration++
  ) {
    let sumAx = 0;
    let sumAy = 0;
    let weightA = 0;
    let sumBx = 0;
    let sumBy = 0;
    let weightB = 0;
    for (const line of lines) {
      const v = doubledAngleVector(line);
      const distanceA = Math.hypot(v.x - centerA.x, v.y - centerA.y);
      const distanceB = Math.hypot(v.x - centerB.x, v.y - centerB.y);
      if (distanceA <= distanceB) {
        sumAx += v.x * line.weight;
        sumAy += v.y * line.weight;
        weightA += line.weight;
      } else {
        sumBx += v.x * line.weight;
        sumBy += v.y * line.weight;
        weightB += line.weight;
      }
    }
    if (weightA > 0) {
      centerA = { x: sumAx / weightA, y: sumAy / weightA };
    }
    if (weightB > 0) {
      centerB = { x: sumBx / weightB, y: sumBy / weightB };
    }
  }

  const angleFromDoubledVector = (v: Point): number =>
    normalizeLineAngle(Math.atan2(v.y, v.x) / 2);
  const centerAngleA = angleFromDoubledVector(centerA);
  const centerAngleB = angleFromDoubledVector(centerB);

  const familyA = lines.filter(
    (line) =>
      lineAngleDifference(angleOfLine(line), centerAngleA) <=
      ORIENTATION_FAMILY_ANGLE_TOLERANCE_RADIANS
  );
  const familyB = lines.filter(
    (line) =>
      lineAngleDifference(angleOfLine(line), centerAngleB) <=
      ORIENTATION_FAMILY_ANGLE_TOLERANCE_RADIANS
  );

  return { familyA, familyB };
};

/** Whether a simple polygon's vertices (in order) form a convex shape. */
const isConvexPolygon = (points: Point[]): boolean => {
  if (points.length < 4) {
    return false;
  }
  let sign = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const c = points[(i + 2) % points.length];
    const cross = (b.x - a.x) * (c.y - b.y) - (b.y - a.y) * (c.x - b.x);
    if (cross !== 0) {
      const currentSign = cross > 0 ? 1 : -1;
      if (sign === 0) {
        sign = currentSign;
      } else if (currentSign !== sign) {
        return false;
      }
    }
  }
  return true;
};

/**
 * Finds where two infinite lines cross, or null if they're (numerically)
 * parallel. Used both for generating candidate quads (intersecting rough,
 * working-resolution lines) and for computing final corners (intersecting
 * the full-resolution robust re-fit of the winning candidate's 4 sides) -
 * the same math applies at either resolution.
 */
export const intersectLines = (
  a: Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'>,
  b: Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'>
): Point | null => {
  const denominator = a.vx * b.vy - a.vy * b.vx;
  if (Math.abs(denominator) < 1e-9) {
    return null;
  }
  const dx = b.x0 - a.x0;
  const dy = b.y0 - a.y0;
  const t = (dx * b.vy - dy * b.vx) / denominator;
  return { x: a.x0 + t * a.vx, y: a.y0 + t * a.vy };
};

/**
 * Generates candidate quads from every pair-of-pairs across two orientation
 * families (one line from each of 2 pairs in family A, crossed with 2 pairs
 * in family B), rejecting only cheap geometric implausibilities (parallel/
 * non-intersecting sides, non-convexity, degenerate or implausible area,
 * hugging the image border) before scoring. Deliberately does not assume
 * family members are mutually parallel - each corner is the real
 * intersection of two independently-fitted lines, so perspective
 * convergence at any angle is handled correctly automatically.
 */
export const generateQuadCandidates = (
  familyA: FittedLine[],
  familyB: FittedLine[],
  width: number,
  height: number
): QuadCandidate[] => {
  const candidates: QuadCandidate[] = [];
  const totalArea = width * height;
  const minArea = MIN_DETECTED_AREA_FRACTION * totalArea;
  const maxArea = 0.95 * totalArea;

  for (let i = 0; i < familyA.length; i++) {
    for (let j = i + 1; j < familyA.length; j++) {
      const lineA1 = familyA[i];
      const lineA2 = familyA[j];
      for (let k = 0; k < familyB.length; k++) {
        for (let l = k + 1; l < familyB.length; l++) {
          const lineB1 = familyB[k];
          const lineB2 = familyB[l];

          const p1 = intersectLines(lineA1, lineB1);
          const p2 = intersectLines(lineA1, lineB2);
          const p3 = intersectLines(lineA2, lineB2);
          const p4 = intersectLines(lineA2, lineB1);
          if (!p1 || !p2 || !p3 || !p4) {
            continue;
          }

          let points: Point[];
          try {
            points = orderPointsByCorner([p1, p2, p3, p4]);
          } catch {
            continue;
          }

          const area = polygonArea(points);
          if (area < minArea || area > maxArea) {
            continue;
          }
          if (!isConvexPolygon(points)) {
            continue;
          }
          if (touchesImageBorder(points, width, height)) {
            continue;
          }

          candidates.push({ points, lineA1, lineA2, lineB1, lineB2 });
        }
      }
    }
  }

  return candidates;
};

/**
 * Fraction of sample points along each side that land near a real edge
 * pixel (small search radius, to tolerate the line fit being a few pixels
 * off from the true edge). The overall score is the *minimum* across the 4
 * sides, not an average - this is the direct fix for a failure mode a
 * contour can't detect: a candidate whose traced boundary switched from
 * the real edge onto a different real edge partway through shows a support
 * gap on that one side, which an average would dilute away but a minimum
 * catches directly.
 */
export const scoreEdgeSupport = (
  points: Point[],
  isEdgePixel: (x: number, y: number) => boolean,
  sampleCount = 20,
  searchRadius = 3
): { overall: number; bySide: number[] } => {
  const bySide: number[] = [];
  for (let side = 0; side < points.length; side++) {
    const p1 = points[side];
    const p2 = points[(side + 1) % points.length];
    let supported = 0;
    for (let i = 0; i <= sampleCount; i++) {
      const t = i / sampleCount;
      const x = Math.round(p1.x + (p2.x - p1.x) * t);
      const y = Math.round(p1.y + (p2.y - p1.y) * t);
      let found = false;
      for (let dx = -searchRadius; dx <= searchRadius && !found; dx++) {
        for (let dy = -searchRadius; dy <= searchRadius && !found; dy++) {
          if (isEdgePixel(x + dx, y + dy)) {
            found = true;
          }
        }
      }
      if (found) {
        supported++;
      }
    }
    bySide.push(supported / (sampleCount + 1));
  }
  return { overall: Math.min(...bySide), bySide };
};

/**
 * For each side, samples several offsets extending inward (only inward -
 * directional, toward the quad's own centroid) looking for additional
 * consistent edge peaks - a true outer frame boundary usually has real
 * nested structure just inside it (a moulding line, the painting's own
 * edge), while an unrelated wall/architectural edge usually doesn't. A
 * generalization, for the line-segment strategy, of the direct-child
 * contour-hierarchy check already shipped for the contour-based strategy -
 * the two paths share no contour/hierarchy structure to reuse code from,
 * so this is a separate implementation of the same underlying idea.
 */
export const scoreNestedParallelSupport = (
  points: Point[],
  isEdgePixel: (x: number, y: number) => boolean,
  width: number,
  height: number
): { overall: number; bySide: number[] } => {
  const centroid = {
    x: points.reduce((sum, p) => sum + p.x, 0) / points.length,
    y: points.reduce((sum, p) => sum + p.y, 0) / points.length,
  };
  const diagonal = Math.hypot(width, height);
  const offsets = [0.02, 0.04, 0.07].map((fraction) => fraction * diagonal);
  const sampleCount = 12;

  const bySide: number[] = [];
  for (let side = 0; side < points.length; side++) {
    const p1 = points[side];
    const p2 = points[(side + 1) % points.length];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const length = Math.hypot(dx, dy) || 1;
    let normalX = -dy / length;
    let normalY = dx / length;
    const midX = (p1.x + p2.x) / 2;
    const midY = (p1.y + p2.y) / 2;
    if ((centroid.x - midX) * normalX + (centroid.y - midY) * normalY < 0) {
      normalX = -normalX;
      normalY = -normalY;
    }

    let samplesWithNestedEdge = 0;
    for (let i = 1; i < sampleCount; i++) {
      const t = i / sampleCount;
      const baseX = p1.x + dx * t;
      const baseY = p1.y + dy * t;
      const hasNestedEdge = offsets.some((offset) =>
        isEdgePixel(
          Math.round(baseX + normalX * offset),
          Math.round(baseY + normalY * offset)
        )
      );
      if (hasNestedEdge) {
        samplesWithNestedEdge++;
      }
    }
    bySide.push(samplesWithNestedEdge / (sampleCount - 1));
  }
  return {
    overall: bySide.reduce((sum, value) => sum + value, 0) / bySide.length,
    bySide,
  };
};

/**
 * Scores whether each "opposite" line pair is geometrically consistent with
 * being the two opposite sides of a real rectangle under perspective
 * projection: either nearly parallel in the image, or converging toward a
 * plausible vanishing point rather than crossing implausibly close to (or
 * inside) the photographed area. A quality/plausibility signal only -
 * corner positions never depend on this (see intersectLines/
 * generateQuadCandidates, which intersect real fitted lines directly
 * regardless of how parallel they are).
 */
export const scoreVanishingPointConsistency = (
  lineA1: FittedLine,
  lineA2: FittedLine,
  lineB1: FittedLine,
  lineB2: FittedLine,
  width: number,
  height: number
): number => {
  const scorePair = (
    a: Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'>,
    b: Pick<FittedLine, 'vx' | 'vy' | 'x0' | 'y0'>
  ): number => {
    const angleDiff = lineAngleDifference(angleOfLine(a), angleOfLine(b));
    const parallelScore = Math.max(
      0,
      1 - angleDiff / VANISHING_POINT_PARALLEL_ANGLE_TOLERANCE_RADIANS
    );
    if (parallelScore > 0) {
      return parallelScore;
    }

    const vanishingPoint = intersectLines(a, b);
    if (!vanishingPoint) {
      return 0;
    }
    const diagonal = Math.hypot(width, height);
    const distanceFromCenter = Math.hypot(
      vanishingPoint.x - width / 2,
      vanishingPoint.y - height / 2
    );
    // A real vanishing point from a photographed rectangle should sit a
    // "reasonable" distance away - these lines crossing near or inside the
    // photographed area is not what two opposite sides of a rectangle
    // should ever do.
    return distanceFromCenter < diagonal ? 0 : 0.5;
  };

  return (scorePair(lineA1, lineA2) + scorePair(lineB1, lineB2)) / 2;
};

/**
 * Combines a candidate's edge-support, nested-parallel-support,
 * vanishing-point-consistency, and area-plausibility scores into one
 * overall score - see the QUAD_SCORE_*_WEIGHT constants' docs.
 */
export const scoreQuadCandidate = (
  candidate: QuadCandidate,
  isEdgePixel: (x: number, y: number) => boolean,
  width: number,
  height: number
): QuadCandidateScore => {
  const edgeSupportResult = scoreEdgeSupport(candidate.points, isEdgePixel);
  const nestedResult = scoreNestedParallelSupport(
    candidate.points,
    isEdgePixel,
    width,
    height
  );
  const vanishingPointScore = scoreVanishingPointConsistency(
    candidate.lineA1,
    candidate.lineA2,
    candidate.lineB1,
    candidate.lineB2,
    width,
    height
  );
  const areaFraction = polygonArea(candidate.points) / (width * height);
  // Soft prior, not a hard cutoff (hard area bounds are already enforced
  // during candidate generation) - comfortable across a broad mid-range
  // rather than rewarding "as large as possible".
  const geometry = Math.min(1, areaFraction / 0.5);

  const overall =
    QUAD_SCORE_EDGE_SUPPORT_WEIGHT * edgeSupportResult.overall +
    QUAD_SCORE_NESTED_PARALLEL_WEIGHT * nestedResult.overall +
    QUAD_SCORE_VANISHING_POINT_WEIGHT * vanishingPointScore +
    QUAD_SCORE_GEOMETRY_WEIGHT * geometry;

  return {
    edgeSupport: edgeSupportResult.overall,
    nestedParallelSupport: nestedResult.overall,
    vanishingPointConsistency: vanishingPointScore,
    geometry,
    overall,
  };
};

/**
 * One round of robust outlier rejection over a line's contributing points:
 * fit, measure each point's perpendicular residual, reject anything beyond
 * REFIT_OUTLIER_MAD_MULTIPLIER times the median absolute deviation (a
 * standard robust-statistics outlier bound, insensitive to the outliers
 * themselves the way a stddev-based cutoff wouldn't be), then refit on the
 * survivors. Used to re-fit each of the winning candidate's 4 sides against
 * full-resolution points for the final, precise corner positions - see
 * detectQuadFromSegments's caller in each DetectionService file.
 */
export const refitLineFromInliers = (
  points: Point[]
): { line: FittedLine; inlierFraction: number } => {
  const initialLine = fitLineToPoints(points);
  const residuals = points.map((p) =>
    perpendicularDistanceToLine(p, initialLine)
  );
  const sortedResiduals = [...residuals].sort((a, b) => a - b);
  const median = sortedResiduals[Math.floor(sortedResiduals.length / 2)];
  const absoluteDeviations = residuals.map((r) => Math.abs(r - median));
  const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
  const mad = sortedDeviations[Math.floor(sortedDeviations.length / 2)];

  const inliers =
    mad < 1e-6
      ? points
      : points.filter(
          (_, i) => absoluteDeviations[i] <= REFIT_OUTLIER_MAD_MULTIPLIER * mad
        );
  const finalPoints = inliers.length >= 2 ? inliers : points;
  const finalLine = fitLineToPoints(finalPoints);

  return {
    line: { ...finalLine, weight: finalPoints.length, points: finalPoints },
    inlierFraction: finalPoints.length / points.length,
  };
};

/**
 * Computes the 4 final corners from the winning candidate's 4 sides after
 * full-resolution robust re-fitting - the same intersect-real-fitted-lines
 * approach as candidate generation, just against more precise lines.
 */
export const computeFinalCornersFromRefittedLines = (
  refittedA1: FittedLine,
  refittedA2: FittedLine,
  refittedB1: FittedLine,
  refittedB2: FittedLine
): Point[] | null => {
  const p1 = intersectLines(refittedA1, refittedB1);
  const p2 = intersectLines(refittedA1, refittedB2);
  const p3 = intersectLines(refittedA2, refittedB2);
  const p4 = intersectLines(refittedA2, refittedB1);
  if (!p1 || !p2 || !p3 || !p4) {
    return null;
  }
  try {
    return orderPointsByCorner([p1, p2, p3, p4]);
  } catch {
    return null;
  }
};

/**
 * Orchestrates the full coarse (working-resolution) line-segment detection
 * pipeline: merge raw Hough segments into real lines, rank and keep the
 * strongest, split into two overlapping orientation families, generate
 * candidate quads, score them all, and return the best one plus an internal
 * confidence figure (the winning score, boosted by how much it beats the
 * runner-up - a narrow win is a weaker signal than a dominant one even at
 * the same absolute score). Returns null if no valid candidate was found at
 * all. isEdgePixel should be backed by the color-aware structural edge map
 * (see each DetectionService file's color-aware edge map step), not plain
 * grayscale Canny output, so the scoring benefits from the same
 * color-awareness the segment detection itself does.
 */
export const detectQuadFromSegments = (
  segments: LineSegment[],
  isEdgePixel: (x: number, y: number) => boolean,
  width: number,
  height: number
): LineSegmentDetectionResult | null => {
  const merged = mergeCollinearSegments(segments, width, height);
  const ranked = [...merged]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, MAX_RANKED_LINES_FOR_CANDIDATES);
  const { familyA, familyB } = clusterOrientations(ranked);
  const candidates = generateQuadCandidates(familyA, familyB, width, height);
  if (candidates.length === 0) {
    return null;
  }

  const scored = candidates.map((candidate) => ({
    candidate,
    score: scoreQuadCandidate(candidate, isEdgePixel, width, height),
  }));
  scored.sort((a, b) => b.score.overall - a.score.overall);

  const best = scored[0];
  const runnerUpScore = scored.length > 1 ? scored[1].score.overall : 0;
  const scoreGap = Math.max(0, best.score.overall - runnerUpScore);
  const QUAD_SCORE_GAP_NORMALIZER = 0.2;
  const confidence =
    Math.max(0, Math.min(1, best.score.overall)) *
    (0.5 + 0.5 * Math.min(1, scoreGap / QUAD_SCORE_GAP_NORMALIZER));

  return {
    points: best.candidate.points,
    confidence,
    scoreBreakdown: best.score,
    contributingLines: [
      best.candidate.lineA1,
      best.candidate.lineA2,
      best.candidate.lineB1,
      best.candidate.lineB2,
    ],
  };
};
