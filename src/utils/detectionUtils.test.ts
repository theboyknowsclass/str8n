import {
  boundingBoxToPoints,
  polygonArea,
  toOrderedRelativePoints,
} from './detectionUtils';

describe("Given the auto-detection pipeline's point-conversion utilities (raw contour points -> a usable overlay quad)", () => {
  describe("when converting a detected quad's absolute pixel points into the overlay's relative, corner-ordered format", () => {
    it('then it normalizes by image size and orders by corner in a single pass, regardless of the input order', () => {
      // A 1000x2000 image with a quad detected slightly off-axis, deliberately
      // supplied out of corner order (as a real contour's point order isn't
      // guaranteed to start at any particular corner) - exercises both
      // normalization and orderPointsByCorner together, since a bug in either
      // step alone would produce a plausible-looking but wrong quad.
      const imageWidth = 1000;
      const imageHeight = 2000;
      const detectedPointsOutOfOrder = [
        { x: 900, y: 1800 }, // bottom-right
        { x: 100, y: 200 }, // top-left
        { x: 850, y: 250 }, // top-right
        { x: 150, y: 1750 }, // bottom-left
      ];

      const result = toOrderedRelativePoints(
        detectedPointsOutOfOrder,
        imageWidth,
        imageHeight
      );

      expect(result).toEqual([
        { x: 0.1, y: 0.1 }, // top-left
        { x: 0.85, y: 0.125 }, // top-right
        { x: 0.9, y: 0.9 }, // bottom-right
        { x: 0.15, y: 0.875 }, // bottom-left
      ]);
    });
  });

  describe("when the largest contour found isn't a clean quadrilateral (the deepest fallback tier)", () => {
    it('then its bounding box is computed correctly regardless of point order or shape', () => {
      // An irregular, non-convex point set (as a noisy real-world contour
      // would produce) - only the extremes should matter for the bounding box.
      const irregularContour = [
        { x: 50, y: 300 },
        { x: 400, y: 50 },
        { x: 200, y: 200 }, // interior point, should not affect the box
        { x: 600, y: 500 },
        { x: 100, y: 450 },
      ];

      const result = boundingBoxToPoints(irregularContour);

      expect(result).toEqual([
        { x: 50, y: 50 }, // top-left
        { x: 600, y: 50 }, // top-right
        { x: 600, y: 500 }, // bottom-right
        { x: 50, y: 500 }, // bottom-left
      ]);
    });

    it('then feeding that bounding box back through the relative-conversion step still produces a valid, corner-ordered overlay quad', () => {
      // Integration across both fallback-tier functions together: the
      // bounding box's own corner order (already TL/TR/BR/BL) must survive
      // toOrderedRelativePoints unchanged, proving the two functions compose
      // correctly end to end as the real fallback path uses them.
      const irregularContour = [
        { x: 800, y: 300 },
        { x: 300, y: 1400 },
        { x: 1200, y: 900 },
      ];
      const imageWidth = 2000;
      const imageHeight = 2000;

      const boundingBox = boundingBoxToPoints(irregularContour);
      const result = toOrderedRelativePoints(
        boundingBox,
        imageWidth,
        imageHeight
      );

      expect(result).toEqual([
        { x: 0.15, y: 0.15 }, // top-left
        { x: 0.6, y: 0.15 }, // top-right
        { x: 0.6, y: 0.7 }, // bottom-right
        { x: 0.15, y: 0.7 }, // bottom-left
      ]);
    });
  });

  describe('when checking whether a candidate polygon is large enough to be "the frame" rather than noise', () => {
    it.each([
      [
        'an axis-aligned rectangle',
        [
          { x: 0, y: 0 },
          { x: 10, y: 0 },
          { x: 10, y: 5 },
          { x: 0, y: 5 },
        ],
        50,
      ],
      [
        'a rotated (diamond) square',
        [
          { x: 5, y: 0 },
          { x: 10, y: 5 },
          { x: 5, y: 10 },
          { x: 0, y: 5 },
        ],
        50,
      ],
    ])(
      'then the shoelace-formula area is correct for %s',
      (_description, points, expectedArea) => {
        expect(polygonArea(points)).toBeCloseTo(expectedArea, 6);
      }
    );
  });

  describe('when given inputs that would otherwise silently produce Infinity/NaN points', () => {
    it('then boundingBoxToPoints fails fast on an empty point set instead of returning Infinity/-Infinity corners', () => {
      expect(() => boundingBoxToPoints([])).toThrow();
    });

    it('then toOrderedRelativePoints fails fast on a zero-width/height image instead of dividing by zero', () => {
      const points = [
        { x: 0, y: 0 },
        { x: 10, y: 0 },
        { x: 10, y: 10 },
        { x: 0, y: 10 },
      ];

      expect(() => toOrderedRelativePoints(points, 0, 100)).toThrow();
      expect(() => toOrderedRelativePoints(points, 100, 0)).toThrow();
    });
  });
});
