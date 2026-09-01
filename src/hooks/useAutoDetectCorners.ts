import { DetectionService } from '@services';
import { useEntitlementStore, useOverlayStore } from '@stores';
import { EntitlementTier, ImageSource } from '@types';

export type UseAutoDetectCorners = {
  detectCorners: (image: ImageSource) => Promise<void>;
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

  const detectCorners = async (image: ImageSource): Promise<void> => {
    if (tier === EntitlementTier.Free) {
      resetPoints();
      return;
    }

    const points = await DetectionService.detectQuad(image);
    setPoints(points);
  };

  return { detectCorners };
};
