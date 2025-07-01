import { Point } from '@types';

/**
 * Orders an array of points according to the Corner enum.
 * - Top_Left (0): Point with smallest x and smallest y
 * - Top_Right (1): Point with largest x and smallest y
 * - Bottom_Right (2): Point with largest x and largest y
 * - Bottom_Left (3): Point with smallest x and smallest y
 *
 * @param points - Array of points to be ordered
 * @returns An array with 4 points ordered according to the Corner enum
 */
export function orderPointsByCorner(points: Point[]): Point[] {
  if (points.length !== 4) {
    throw new Error('Points array must contain exactly 4 points');
  }

  // Clone the points to avoid mutating the original array
  const pointsCopy = [...points];

  // First sort by y coordinate (top to bottom)
  const sortedByY = [...pointsCopy].sort((a, b) => a.y - b.y);

  // Split into top and bottom pairs
  const topPoints = sortedByY.slice(0, 2);
  const bottomPoints = sortedByY.slice(2, 4);

  // Sort each pair by x coordinate (left to right)
  const topSorted = topPoints.sort((a, b) => a.x - b.x);
  const bottomSorted = bottomPoints.sort((a, b) => a.x - b.x);

  // Create the final ordered array according to Corner enum
  const result: Point[] = [
    topSorted[0], // Top_Left (0)
    topSorted[1], // Top_Right (1)
    bottomSorted[1], // Bottom_Right (2)
    bottomSorted[0], // Bottom_Left (3)
  ];

  return result;
}

/**
 * Gets the largest rectangle that fits within a quadrilateral using a simple min/max approach.
 *
 * @param sortedPoints - Array of 4 points sorted according to Corner enum
 * @returns An object with topLeft and bottomRight points defining the rectangle
 */
export function getLargestRectangle(sortedPoints: Point[]): {
  topLeft: Point;
  bottomRight: Point;
} {
  if (sortedPoints.length !== 4) {
    throw new Error('Points array must contain exactly 4 points');
  }

  // Extract the points
  const [topLeft, topRight, bottomRight, bottomLeft] = sortedPoints;

  // Find the inner rectangle coordinates using min/max
  const left = Math.max(topLeft.x, bottomLeft.x);
  const top = Math.max(topLeft.y, topRight.y);
  const right = Math.min(topRight.x, bottomRight.x);
  const bottom = Math.min(bottomLeft.y, bottomRight.y);

  // Return the rectangle defined by its top-left and bottom-right points
  return {
    topLeft: { x: left, y: top },
    bottomRight: { x: right, y: bottom },
  };
}

/**
 * Converts a rectangle defined by topLeft and bottomRight points to an array of 4 corner points.
 *
 * @param rectangle - Object with topLeft and bottomRight points
 * @returns Array of 4 points in Corner enum order
 */
export function getPoints(rectangle: {
  topLeft: Point;
  bottomRight: Point;
}): Point[] {
  const { topLeft, bottomRight } = rectangle;

  return [
    topLeft, // Top-left
    { x: bottomRight.x, y: topLeft.y }, // Top-right
    bottomRight, // Bottom-right
    { x: topLeft.x, y: bottomRight.y }, // Bottom-left
  ];
}

/**
 * Converts relative points to absolute points based on the given width and height.
 *
 * @param points - Array of points to convert
 * @param width - Width of the image
 * @param height - Height of the image
 * @returns Array of points with absolute coordinates
 */
export const getAbsolutePoints = (
  points: Point[],
  width: number,
  height: number
): Point[] => {
  return points.map((point) => ({
    x: point.x * width,
    y: point.y * height,
  }));
};
