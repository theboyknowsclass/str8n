import {
  deriveSkiaTranslate,
  computeZoomAroundPointTranslate,
} from './panZoomTransformUtils';
import type { Vector } from '@types';

/**
 * Computes the on-screen position of a fixed image-pixel-space point, given
 * PanZoomContext's raw translate/scale state. This mirrors what ImageView.tsx
 * actually renders (Group transform = [translate, scale], applied to Skia
 * content already positioned via deriveSkiaTranslate) - it composes the same
 * two transforms the real render path does, so these tests check "does the
 * pixel that should stay under your finger actually stay under your finger"
 * end to end, not just "does each transform match what I wrote in isolation".
 */
const screenPositionOf = (
  contentPoint: Vector,
  rawTranslate: Vector,
  rawScale: number,
  constants: Parameters<typeof deriveSkiaTranslate>[2]
): Vector => {
  const skiaTranslate = deriveSkiaTranslate(rawTranslate, rawScale, constants);
  return {
    x: (contentPoint.x + skiaTranslate.x) * rawScale,
    y: (contentPoint.y + skiaTranslate.y) * rawScale,
  };
};

// A representative, non-trivial set of mount-time constants: a scaled image
// larger than its bordered content area (so initialTopLeft is nonzero and
// positive - see calculateInitialTopLeft in editControlUtils.ts), mounted
// away from scale=1 and translate=(0,0). Every scenario below is a variation
// on this same starting setup.
const constants = {
  initialTranslate: { x: -30, y: -15 },
  initialTopLeft: { x: 40, y: 25 },
  initialScale: 0.8,
};

describe("Given the Edit screen's two-layer pan/zoom transform (PanZoomContext raw translate/scale -> SelectionControl's derived Skia translate -> on-screen position)", () => {
  describe('when the image is at its initial mount state (no pan or zoom yet)', () => {
    it('then the derived Skia translate is exactly the negative of the centering offset', () => {
      // At mount (rawTranslate == initialTranslate, rawScale == initialScale),
      // the (T-T0)*S term vanishes and relativeScale == 1, so the formula
      // should reduce to exactly -initialTopLeft regardless of its value.
      const result = deriveSkiaTranslate(
        constants.initialTranslate,
        constants.initialScale,
        constants
      );

      expect(result).toEqual({ x: -40, y: -25 });
    });
  });

  describe('when the raw translate moves away from initialTranslate at a fixed scale', () => {
    it('then the derived Skia translate scales that movement by the current scale', () => {
      const zeroedConstants = {
        initialTranslate: { x: 0, y: 0 },
        initialTopLeft: { x: 0, y: 0 },
        initialScale: 1,
      };

      const result = deriveSkiaTranslate({ x: 10, y: 4 }, 2, zeroedConstants);

      // (10-0)*2 - 0 = 20, (4-0)*2 - 0 = 8
      expect(result).toEqual({ x: 20, y: 8 });
    });
  });

  describe('when the user zooms (pinch or wheel) around a screen-space focal point', () => {
    it.each([
      [{ x: -30, y: -15 }, 0.8, 1.2, { x: 150, y: 200 }],
      [{ x: -30, y: -15 }, 0.8, 0.5, { x: 0, y: 0 }],
      [{ x: -50, y: 10 }, 1.5, 1.5001, { x: 300, y: 50 }], // near-zero zoom delta
      [{ x: -50, y: 10 }, 1.5, 0.9, { x: 300, y: 400 }],
      [{ x: 12, y: -40 }, 0.8, 2, { x: -100, y: 75 }], // focal point outside [0, viewport]
    ] as const)(
      'then the content point under the focal point stays under it end to end through both transforms (%#): oldTranslate=%o oldScale=%p newScale=%p focal=%o',
      (oldTranslate, oldScale, newScale, focalPoint) => {
        // Given a content-space point currently sitting under the focal
        // point (reconstructed by inverting the full transform pipeline at
        // the "before" state, exactly as a real gesture would encounter it)
        const skiaTranslateOld = deriveSkiaTranslate(
          oldTranslate,
          oldScale,
          constants
        );
        const contentPoint: Vector = {
          x: focalPoint.x / oldScale - skiaTranslateOld.x,
          y: focalPoint.y / oldScale - skiaTranslateOld.y,
        };
        const before = screenPositionOf(
          contentPoint,
          oldTranslate,
          oldScale,
          constants
        );
        expect(before.x).toBeCloseTo(focalPoint.x, 6);
        expect(before.y).toBeCloseTo(focalPoint.y, 6);

        // When the zoom-around-point fix computes the new raw translate
        const newTranslate = computeZoomAroundPointTranslate(
          focalPoint,
          oldTranslate,
          oldScale,
          newScale,
          constants
        );

        // Then re-deriving the Skia translate and re-rendering the same
        // content point (the full pipeline again, at the new state) must
        // land back on the same screen position - i.e. it didn't jump.
        const after = screenPositionOf(
          contentPoint,
          newTranslate,
          newScale,
          constants
        );
        expect(after.x).toBeCloseTo(focalPoint.x, 6);
        expect(after.y).toBeCloseTo(focalPoint.y, 6);
      }
    );

    it('then zooming to the same scale is a no-op on the raw translate', () => {
      const oldTranslate = { x: -30, y: -15 };
      const result = computeZoomAroundPointTranslate(
        { x: 100, y: 100 },
        oldTranslate,
        1,
        1,
        constants
      );
      expect(result.x).toBeCloseTo(oldTranslate.x, 6);
      expect(result.y).toBeCloseTo(oldTranslate.y, 6);
    });
  });
});
