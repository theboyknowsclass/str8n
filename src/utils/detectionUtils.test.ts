import {
  boundingBoxToPoints,
  computeAdaptiveCannySigma,
  computeDiagonalFeatures,
  computePolygonIoU,
  polygonArea,
  toOrderedRelativePoints,
  touchesImageBorder,
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

  describe("when scoring a detected quad against a hand-marked ground-truth quad (the calibration sweep's accuracy metric)", () => {
    it('then two identical quads score a perfect 1.0 IoU', () => {
      const quad = [
        { x: 0.1, y: 0.1 },
        { x: 0.9, y: 0.1 },
        { x: 0.9, y: 0.9 },
        { x: 0.1, y: 0.9 },
      ];

      expect(computePolygonIoU(quad, quad)).toBeCloseTo(1, 6);
    });

    it('then two quads with no overlap at all score 0', () => {
      const topLeftQuad = [
        { x: 0, y: 0 },
        { x: 0.2, y: 0 },
        { x: 0.2, y: 0.2 },
        { x: 0, y: 0.2 },
      ];
      const bottomRightQuad = [
        { x: 0.8, y: 0.8 },
        { x: 1, y: 0.8 },
        { x: 1, y: 1 },
        { x: 0.8, y: 1 },
      ];

      expect(computePolygonIoU(topLeftQuad, bottomRightQuad)).toBe(0);
    });

    it('then a partially-overlapping quad scores the correct fraction (intersection over union)', () => {
      // A unit square overlapping a square shifted right and down by half its
      // side - intersection is a quarter of each square's area, union is
      // 7/4 of one square's area, so IoU = (1/4) / (7/4) = 1/7.
      const first = [
        { x: 0, y: 0 },
        { x: 2, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 },
      ];
      const second = [
        { x: 1, y: 1 },
        { x: 3, y: 1 },
        { x: 3, y: 3 },
        { x: 1, y: 3 },
      ];

      expect(computePolygonIoU(first, second)).toBeCloseTo(1 / 7, 6);
    });
  });

  describe("when checking whether a candidate contour is actually a self-contained object in the photo, rather than an artifact of the photo's own edge", () => {
    it('then a contour well within the image bounds does not touch the border', () => {
      const centeredQuad = [
        { x: 200, y: 200 },
        { x: 800, y: 200 },
        { x: 800, y: 800 },
        { x: 200, y: 800 },
      ];

      expect(touchesImageBorder(centeredQuad, 1000, 1000)).toBe(false);
    });

    it('then a contour tracing the image edge (as Canny/dilate can produce) is flagged as touching the border', () => {
      const fullImageQuad = [
        { x: 0, y: 0 },
        { x: 999, y: 0 },
        { x: 999, y: 999 },
        { x: 0, y: 999 },
      ];

      expect(touchesImageBorder(fullImageQuad, 1000, 1000)).toBe(true);
    });

    it('then a single corner crossing the margin does not flag the whole contour, if the rest are genuinely interior', () => {
      // A real, correctly detected frame can legitimately have one corner
      // sit close to the edge of the shot (a tight crop) - only rejecting
      // when every corner traces the border avoids throwing out a genuine
      // detection for superficially resembling a border-trace artifact.
      const mostlyInteriorQuad = [
        { x: 200, y: 200 },
        { x: 800, y: 200 },
        { x: 800, y: 800 },
        { x: 5, y: 800 }, // this one corner sits within the border margin
      ];

      expect(touchesImageBorder(mostlyInteriorQuad, 1000, 1000)).toBe(false);
    });

    it('then every corner must cross the margin to flag the contour', () => {
      const allCornersNearBorder = [
        { x: 5, y: 5 },
        { x: 995, y: 5 },
        { x: 995, y: 995 },
        { x: 5, y: 995 },
      ];

      expect(touchesImageBorder(allCornersNearBorder, 1000, 1000)).toBe(true);
    });
  });

  describe("when estimating a per-photo Canny sigma from how sharp the frame's real edge is", () => {
    // A synthetic image with a circular "frame" boundary a quarter of the
    // way in from each edge - every corner-to-center ray crosses it exactly
    // once, so these behave like a real photo's frame edge for this
    // function's purposes without needing an actual OpenCV Mat.
    const makeStepImage = (
      width: number,
      height: number,
      insideValue: number,
      outsideValue: number
    ) => {
      const centerX = width / 2;
      const centerY = height / 2;
      const edgeRadius = Math.min(width, height) / 4;
      return (x: number, y: number) => {
        const dx = x - centerX;
        const dy = y - centerY;
        return Math.sqrt(dx * dx + dy * dy) < edgeRadius
          ? insideValue
          : outsideValue;
      };
    };

    it('then a sharp, high-contrast edge (e.g. a dark frame on a light wall) produces the tightest sigma', () => {
      const getPixel = makeStepImage(1000, 1000, 255, 0);

      expect(computeAdaptiveCannySigma(getPixel, 1000, 1000)).toBeCloseTo(
        0.2,
        6
      );
    });

    it('then a faint, low-contrast edge (e.g. a light frame on a similarly light wall) produces a looser sigma', () => {
      const getPixel = makeStepImage(1000, 1000, 140, 120);

      expect(computeAdaptiveCannySigma(getPixel, 1000, 1000)).toBeCloseTo(
        0.5,
        6
      );
    });

    it('then a perfectly flat image with no edge at all produces the loosest sigma, rather than the tightest', () => {
      const getPixel = () => 128;

      expect(computeAdaptiveCannySigma(getPixel, 1000, 1000)).toBeCloseTo(
        0.6,
        6
      );
    });
  });

  describe('when extracting the full diagonal feature vector a photo trains the calibration model on', () => {
    it('then aspectRatio is simply width divided by height', () => {
      const getPixel = () => 100;

      const features = computeDiagonalFeatures(getPixel, 1600, 800);

      expect(features.aspectRatio).toBeCloseTo(2, 6);
    });

    it('then meanIntensity and intensityStdDev reduce to the flat value and zero for a uniform image', () => {
      const getPixel = () => 77;

      const features = computeDiagonalFeatures(getPixel, 500, 500);

      expect(features.meanIntensity).toBeCloseTo(77, 6);
      expect(features.intensityStdDev).toBeCloseTo(0, 6);
    });

    it('then each ray reports where along its path the sharpest jump occurred, not just its magnitude', () => {
      // A square "inside" region centered on the image, inset exactly
      // halfway from each corner to the center - by symmetry, all 4
      // corner-to-center rays cross this boundary at the same fraction of
      // their length, giving a known expected jump location for all 4.
      const width = 1000;
      const height = 1000;
      const getPixel = (x: number, y: number) =>
        x >= 250 && x <= 750 && y >= 250 && y <= 750 ? 255 : 0;

      const features = computeDiagonalFeatures(getPixel, width, height);

      expect(features.ray0JumpMagnitude).toBe(255);
      expect(features.ray0JumpLocation).toBeCloseTo(0.5, 1);
      expect(features.ray1JumpLocation).toBeCloseTo(0.5, 1);
      expect(features.ray2JumpLocation).toBeCloseTo(0.5, 1);
      expect(features.ray3JumpLocation).toBeCloseTo(0.5, 1);
    });
  });
});
