import cv, { EmscriptenEmbindInstance } from '@techstark/opencv-js';
import { Point, ImageSource } from '@types';
import { initialPoints } from '@stores/useOverlayStore';
import {
  MAX_CONTOURS_TO_TEST,
  MIN_DETECTED_AREA_FRACTION,
  boundingBoxToPoints,
  polygonArea,
  toOrderedRelativePoints,
} from '@utils/detectionUtils';
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
   * @returns Promise resolving to 4 points in relative (0-1) coordinates
   */
  static detectQuad = async (
    image: ImageSource,
    signal?: AbortSignal
  ): Promise<Point[]> => {
    if (!cv || !cv.Mat || !image.uri) {
      return initialPoints;
    }

    const {
      uri,
      dimensions: { width, height },
    } = image;

    const itemsToDelete: EmscriptenEmbindInstance[] = [];

    try {
      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const src = cv.imread(await TransformService.getHTMLImageElement(uri));
      itemsToDelete.push(src);

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const gray = new cv.Mat();
      itemsToDelete.push(gray);
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

      const blurred = new cv.Mat();
      itemsToDelete.push(blurred);
      cv.GaussianBlur(gray, blurred, new cv.Size(5, 5), 0);

      if (signal?.aborted) {
        throw new Error('AbortError');
      }

      const viaCanny = this.findQuadViaCanny(
        blurred,
        width,
        height,
        itemsToDelete
      );
      if (viaCanny) {
        return toOrderedRelativePoints(viaCanny, width, height);
      }

      const viaAdaptiveThreshold = this.findQuadViaAdaptiveThreshold(
        blurred,
        width,
        height,
        itemsToDelete
      );
      if (viaAdaptiveThreshold) {
        return toOrderedRelativePoints(viaAdaptiveThreshold, width, height);
      }

      const largestContourBoundingBox = this.findLargestContourBoundingBox(
        blurred,
        width,
        height,
        itemsToDelete
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
      itemsToDelete.forEach((item) => item.delete());
    }
  };

  /**
   * Primary detection strategy: edge-based. Works well for a frame with
   * reasonable contrast against its background.
   */
  private static findQuadViaCanny(
    blurred: cv.Mat,
    width: number,
    height: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const meanIntensity = cv.mean(blurred)[0];

    // Standard auto-Canny heuristic: threshold around the image's own mean
    // intensity rather than fixed constants, since gallery lighting varies
    // a lot photo to photo.
    const lowerThreshold = Math.max(0, 0.66 * meanIntensity);
    const upperThreshold = Math.min(255, 1.33 * meanIntensity);

    const edges = new cv.Mat();
    itemsToDelete.push(edges);
    cv.Canny(blurred, edges, lowerThreshold, upperThreshold);

    const kernel = cv.Mat.ones(3, 3, cv.CV_8U);
    itemsToDelete.push(kernel);
    cv.dilate(edges, edges, kernel, new cv.Point(-1, -1), 2);

    return this.findQuadFromBinaryMask(edges, width, height, itemsToDelete);
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
      itemsToDelete
    );
  }

  /**
   * Shared contour-search logic for both detection strategies above: finds
   * contours in a binary mask, tests the largest few by area, and accepts
   * the first one whose simplified (approxPolyDP) shape has exactly 4
   * vertices and covers a large-enough fraction of the image.
   */
  private static findQuadFromBinaryMask(
    binaryMask: cv.Mat,
    width: number,
    height: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const contours = new cv.MatVector();
    itemsToDelete.push(contours);
    const hierarchy = new cv.Mat();
    itemsToDelete.push(hierarchy);
    cv.findContours(
      binaryMask,
      contours,
      hierarchy,
      cv.RETR_EXTERNAL,
      cv.CHAIN_APPROX_SIMPLE
    );

    const contourCount = contours.size();
    if (contourCount === 0) {
      return null;
    }

    const minArea = MIN_DETECTED_AREA_FRACTION * width * height;
    const areasByIndex: { index: number; area: number }[] = [];
    for (let i = 0; i < contourCount; i++) {
      const contour = contours.get(i);
      itemsToDelete.push(contour);
      areasByIndex.push({ index: i, area: cv.contourArea(contour) });
    }
    const largestIndicesFirst = areasByIndex
      .sort((a, b) => b.area - a.area)
      .slice(0, MAX_CONTOURS_TO_TEST);

    for (const { index, area } of largestIndicesFirst) {
      if (area < minArea) {
        continue;
      }

      const contour = contours.get(index);
      itemsToDelete.push(contour);
      const perimeter = cv.arcLength(contour, true);
      const approx = new cv.Mat();
      itemsToDelete.push(approx);
      cv.approxPolyDP(contour, approx, 0.02 * perimeter, true);

      const approxPoints = this.matToPoints(approx);
      if (approxPoints.length === 4 && polygonArea(approxPoints) >= minArea) {
        return approxPoints;
      }
    }

    return null;
  }

  /**
   * Last-resort fallback: if no contour approximates cleanly to a
   * quadrilateral, use the axis-aligned bounding box of the single largest
   * contour found. Less precise (ignores any rotation/skew), but still a
   * meaningfully better starting point than the generic centered default.
   */
  private static findLargestContourBoundingBox(
    blurred: cv.Mat,
    width: number,
    height: number,
    itemsToDelete: EmscriptenEmbindInstance[]
  ): Point[] | null {
    const edges = new cv.Mat();
    itemsToDelete.push(edges);
    cv.Canny(blurred, edges, 50, 150);

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
    if (contourCount === 0) {
      return null;
    }

    let largestPoints: Point[] | null = null;
    let largestArea = 0;
    for (let i = 0; i < contourCount; i++) {
      const contour = contours.get(i);
      itemsToDelete.push(contour);
      const area = cv.contourArea(contour);
      if (area > largestArea) {
        largestArea = area;
        largestPoints = this.matToPoints(contour);
      }
    }

    if (
      !largestPoints ||
      largestArea < MIN_DETECTED_AREA_FRACTION * width * height
    ) {
      return null;
    }

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
