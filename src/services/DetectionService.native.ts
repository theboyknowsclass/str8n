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
  Mat,
  PointVectorOfVectors,
} from 'react-native-fast-opencv';
import { Point, ImageSource } from '@types';
import { initialPoints } from '@stores/useOverlayStore';
import {
  MAX_CONTOURS_TO_TEST,
  MIN_DETECTED_AREA_FRACTION,
  boundingBoxToPoints,
  polygonArea,
  toOrderedRelativePoints,
} from '@utils/detectionUtils';
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
   * @returns Promise resolving to 4 points in relative (0-1) coordinates
   */
  static detectQuad = async (
    image: ImageSource,
    signal?: AbortSignal
  ): Promise<Point[]> => {
    OpenCV.clearBuffers();

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

      const viaCanny = this.findQuadViaCanny(blurred, width, height);
      if (viaCanny) {
        return toOrderedRelativePoints(viaCanny, width, height);
      }

      const viaAdaptiveThreshold = this.findQuadViaAdaptiveThreshold(
        blurred,
        width,
        height
      );
      if (viaAdaptiveThreshold) {
        return toOrderedRelativePoints(viaAdaptiveThreshold, width, height);
      }

      const largestContourBoundingBox = this.findLargestContourBoundingBox(
        blurred,
        width,
        height
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
   * Primary detection strategy: edge-based. Works well for a frame with
   * reasonable contrast against its background.
   */
  private static findQuadViaCanny(
    blurred: Mat,
    width: number,
    height: number
  ): Point[] | null {
    const meanIntensity = OpenCV.toJSValue(OpenCV.invoke('mean', blurred)).a;

    // Standard auto-Canny heuristic: threshold around the image's own mean
    // intensity rather than fixed constants, since gallery lighting varies
    // a lot photo to photo.
    const lowerThreshold = Math.max(0, 0.66 * meanIntensity);
    const upperThreshold = Math.min(255, 1.33 * meanIntensity);

    const edges = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('Canny', blurred, edges, lowerThreshold, upperThreshold);

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

    return this.findQuadFromBinaryMask(dilated, width, height);
  }

  /**
   * Fallback detection strategy: adaptive-threshold based. Handles
   * low-contrast frames (e.g. a light frame against a similarly light
   * wall) where Canny's edge response is too weak to find a clean contour.
   */
  private static findQuadViaAdaptiveThreshold(
    blurred: Mat,
    width: number,
    height: number
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

    return this.findQuadFromBinaryMask(closed, width, height);
  }

  /**
   * Shared contour-search logic for both detection strategies above: finds
   * contours in a binary mask, tests the largest few by area, and accepts
   * the first one whose simplified (approxPolyDP) shape has exactly 4
   * vertices and covers a large-enough fraction of the image.
   */
  private static findQuadFromBinaryMask(
    binaryMask: Mat,
    width: number,
    height: number
  ): Point[] | null {
    const contours = OpenCV.createObject(ObjectType.PointVectorOfVectors);
    OpenCV.invoke(
      'findContours',
      binaryMask,
      contours,
      RetrievalModes.RETR_EXTERNAL,
      ContourApproximationModes.CHAIN_APPROX_SIMPLE
    );

    const contourPoints = OpenCV.toJSValue(contours).array;
    if (contourPoints.length === 0) {
      return null;
    }

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
      const perimeter = OpenCV.invoke('arcLength', contour, true).value;
      const approx = OpenCV.createObject(ObjectType.PointVector);
      OpenCV.invoke('approxPolyDP', contour, approx, 0.02 * perimeter, true);
      const approxPoints = OpenCV.toJSValue(approx).array;

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
    blurred: Mat,
    width: number,
    height: number
  ): Point[] | null {
    const edges = OpenCV.createObject(
      ObjectType.Mat,
      height,
      width,
      DataTypes.CV_8U
    );
    OpenCV.invoke('Canny', blurred, edges, 50, 150);

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

    let largest = contourPoints[0];
    let largestArea = polygonArea(largest);
    for (let i = 1; i < contourPoints.length; i++) {
      const area = polygonArea(contourPoints[i]);
      if (area > largestArea) {
        largest = contourPoints[i];
        largestArea = area;
      }
    }

    if (largestArea < MIN_DETECTED_AREA_FRACTION * width * height) {
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
