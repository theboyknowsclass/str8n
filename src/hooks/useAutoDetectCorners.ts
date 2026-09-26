import { DetectionService } from '@services';
import { initialPoints, useEntitlementStore, useOverlayStore } from '@stores';
import { EntitlementTier, ImageSource } from '@types';
import { debugLog } from '@utils/debugLog';
import { logDuration } from '@utils/benchmarkLog';

export type UseAutoDetectCorners = {
  /**
   * Runs detection and applies its result to the overlay. Resolves to
   * whether a real quad was actually found, rather than the manual
   * centered-square default - detectQuad returns that exact same
   * `initialPoints` reference on every fallback path (no cv.Mat available,
   * an unentitled tier, or every detection strategy failing), so reference
   * equality against it is a precise, already-implicit signal of "detection
   * gave up" without detectQuad needing its own richer return type.
   */
  detectCorners: (image: ImageSource) => Promise<boolean>;
};

/**
 * Hook that sets the overlay's initial corner points for a newly-picked
 * image, using automatic detection when the user's subscription tier
 * unlocks it and falling back to the existing manual centered-square
 * default otherwise.
 *
 * DetectionService.detectQuad never rejects (see its own docs) - it
 * resolves to a default centered quad on any failure - so callers don't
 * need their own error handling here either.
 *
 * @example
 * ```typescript
 * const { detectCorners } = useAutoDetectCorners();
 * await detectCorners(pickedImage);
 * ```
 */
export const useAutoDetectCorners = (): UseAutoDetectCorners => {
  const { tier } = useEntitlementStore();
  const { resetPoints, setPoints } = useOverlayStore();

  const detectCorners = async (image: ImageSource): Promise<boolean> => {
    debugLog('>>>> useAutoDetectCorners: detectCorners called', {
      uri: image.uri,
      tier,
    });

    if (tier === EntitlementTier.Free) {
      debugLog('>>>> useAutoDetectCorners: Free tier, resetting to default');
      resetPoints();
      return false;
    }

    const points = await logDuration('magic wand (detectQuad)', () =>
      DetectionService.detectQuad(image)
    );
    setPoints(points);
    const detected = points !== initialPoints;
    debugLog('>>>> useAutoDetectCorners: detection result', {
      detected,
      points,
    });
    return detected;
  };

  return { detectCorners };
};
