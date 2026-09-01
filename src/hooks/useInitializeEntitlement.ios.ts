import { useEffect } from 'react';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';
import { useEntitlementStore, applyCustomerInfo } from '@stores';
import { EntitlementTier } from '@types';

/**
 * Return type for the useInitializeEntitlement hook: whether entitlement
 * initialization is complete.
 */
type UseInitializeEntitlement = boolean;

/**
 * Hook for initializing the user's subscription tier from RevenueCat.
 *
 * iOS-only implementation (see the generic useInitializeEntitlement.ts for
 * every other platform) - Metro resolves this file only when bundling for
 * iOS, so 'react-native-purchases' is never imported into the web/Android
 * bundle at all, rather than merely being unused at runtime there.
 *
 * If no RevenueCat API key is configured yet (e.g. local development before
 * a RevenueCat project exists), this resolves straight to Free rather than
 * failing - the app must always be usable even with entitlements unavailable.
 *
 * @returns UseInitializeEntitlement boolean indicating if the tier is ready
 *
 * @example
 * ```typescript
 * const isReady = useInitializeEntitlement();
 * ```
 */
export const useInitializeEntitlement = (): UseInitializeEntitlement => {
  const { setTier, setIsReady, isReady } = useEntitlementStore();

  useEffect(() => {
    const loadInitialData = async () => {
      const apiKey = Constants.expoConfig?.extra?.revenueCat?.iosApiKey;

      if (!apiKey) {
        setIsReady(true);
        return;
      }

      try {
        Purchases.configure({ apiKey });
        const customerInfo = await Purchases.getCustomerInfo();
        applyCustomerInfo(customerInfo);
      } catch (error) {
        console.error('Error loading entitlement', error);
        setTier(EntitlementTier.Free);
      } finally {
        setIsReady(true);
      }
    };

    loadInitialData();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isReady;
};
