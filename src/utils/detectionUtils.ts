import { Point } from '@types';
import { orderPointsByCorner } from '@utils/transformUtils';

/**
 * Minimum fraction of the total image area a detected quad/contour must
 * cover to be accepted as "the frame" rather than noise or an unrelated
 * small object in the scene.
 */
export const MIN_DETECTED_AREA_FRACTION = 0.15;

/**
 * How many of the largest contours (by area) to test with approxPolyDP
 * before giving up on a detection pass. Bounded so a photo with lots of
 * texture/noise (producing hundreds of tiny contours) doesn't cost
 * unbounded approxPolyDP calls.
 */
export const MAX_CONTOURS_TO_TEST = 5;

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
