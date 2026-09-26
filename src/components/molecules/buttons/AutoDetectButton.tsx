import { useState } from 'react';
import { IconButton } from '@atoms';
import { useAutoDetectCorners, useNavigation } from '@hooks';
import { useEntitlementStore, useSourceImageStore } from '@stores';
import { EntitlementTier } from '@types';

/**
 * AutoDetectButton component ("magic wand") that runs automatic corner
 * detection on demand against the currently-loaded image, using the
 * current detection thresholds.
 *
 * This is the actual conversion path for the auto-detection feature: it's
 * shown to every tier, but Free-tier users are sent to the paywall instead
 * of getting a real (silently unhelpful) detection attempt, since Free has
 * no entitlement to the feature. Paid tiers get the real detection pass,
 * with a loading spinner while the CV pipeline runs.
 *
 * @returns JSX element containing the auto-detect button
 *
 * @example
 * ```typescript
 * <AutoDetectButton />
 * ```
 */
export const AutoDetectButton: React.FC = () => {
  const { tier } = useEntitlementStore();
  const { sourceImage } = useSourceImageStore();
  const { detectCorners } = useAutoDetectCorners();
  const { navigate } = useNavigation();
  const [isDetecting, setIsDetecting] = useState(false);

  const onPress = async () => {
    if (tier === EntitlementTier.Free) {
      navigate('paywall');
      return;
    }

    setIsDetecting(true);
    try {
      await detectCorners(sourceImage);
    } finally {
      setIsDetecting(false);
    }
  };

  return (
    <IconButton
      icon="auto-fix-high"
      onPress={onPress}
      loading={isDetecting}
      accessibilityLabel="Auto-detect corners"
    />
  );
};
