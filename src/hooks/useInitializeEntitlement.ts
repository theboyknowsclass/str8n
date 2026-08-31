import { useEffect } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import Purchases from 'react-native-purchases';
import { useEntitlementStore } from '@stores';
import { EntitlementTier, ENTITLEMENT_IDENTIFIERS } from '@types';

/**
 * Return type for the useInitializeEntitlement hook.
 * @property isReady - Boolean indicating if entitlement initialization is complete
 */
type UseInitializeEntitlement = boolean;

/**
 * Hook for initializing the user's subscription tier from RevenueCat.
 *
 * Paid tiers are iOS-only for now: RevenueCat has no web purchase path, and
 * Android hasn't been submitted to the Play Store yet. On any other platform,
 * or if no RevenueCat API key is configured (e.g. local development before a
 * RevenueCat project exists), this resolves straight to Free rather than
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
      if (Platform.OS !== 'ios') {
        setIsReady(true);
        return;
      }

      const apiKey = Constants.expoConfig?.extra?.revenueCat?.iosApiKey;

      if (!apiKey) {
        setIsReady(true);
        return;
      }

      try {
        Purchases.configure({ apiKey });
        const customerInfo = await Purchases.getCustomerInfo();
        const { active } = customerInfo.entitlements;

        if (active[ENTITLEMENT_IDENTIFIERS[EntitlementTier.AutoMultiPoint]]) {
          setTier(EntitlementTier.AutoMultiPoint);
        } else if (
          active[ENTITLEMENT_IDENTIFIERS[EntitlementTier.Auto4Point]]
        ) {
          setTier(EntitlementTier.Auto4Point);
        } else {
          setTier(EntitlementTier.Free);
        }
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
