import { useEffect } from 'react';
import { useEntitlementStore } from '@stores';

/**
 * Return type for the useInitializeEntitlement hook: whether entitlement
 * initialization is complete.
 */
type UseInitializeEntitlement = boolean;

/**
 * Non-iOS implementation of useInitializeEntitlement (see
 * useInitializeEntitlement.ios.ts for the real RevenueCat-backed one).
 * Paid tiers are iOS-only for now - RevenueCat has no web purchase path,
 * and Android hasn't been submitted to the Play Store yet - so every other
 * platform resolves straight to Free, immediately.
 *
 * Kept as a separate platform file (rather than an `if (Platform.OS ===
 * 'ios')` branch in one shared file) so that 'react-native-purchases' is
 * never imported into the web/Android bundle at all, not merely unused at
 * runtime there.
 *
 * @returns UseInitializeEntitlement boolean indicating if the tier is ready
 *
 * @example
 * ```typescript
 * const isReady = useInitializeEntitlement();
 * ```
 */
export const useInitializeEntitlement = (): UseInitializeEntitlement => {
  const { setIsReady, isReady } = useEntitlementStore();

  useEffect(() => {
    setIsReady(true);
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isReady;
};
