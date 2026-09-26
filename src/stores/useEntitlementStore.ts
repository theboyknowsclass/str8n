import { EntitlementTier, ENTITLEMENT_IDENTIFIERS } from '@types';
import { create } from 'zustand';
import type { CustomerInfo } from 'react-native-purchases';

/**
 * Entitlement state interface that tracks the user's current subscription tier.
 * The tier is refreshed from RevenueCat at app launch (see useInitializeEntitlement)
 * and is not itself persisted - RevenueCat's on-device cache is the source of truth.
 * @property tier - The user's current subscription tier
 * @property isReady - Whether the tier has been resolved (from RevenueCat, or defaulted to Free)
 * @property setTier - Sets the current tier
 * @property setIsReady - Sets the ready state
 */
type EntitlementState = {
  tier: EntitlementTier;
  isReady: boolean;
  setTier: (tier: EntitlementTier) => void;
  setIsReady: (isReady: boolean) => void;
};

/**
 * Zustand store for the user's current subscription tier.
 *
 * @example
 * ```typescript
 * const { tier, isReady } = useEntitlementStore();
 * if (tier >= EntitlementTier.Auto4Point) { ... }
 * ```
 */
// TEMPORARY: default tier bumped to the top of the ladder so every
// auto-detection feature is usable while RevenueCat/App Store Connect setup
// is still in progress. Once real entitlements are live, applyCustomerInfo
// still downgrades non-subscribers back to Free as normal - revert this
// default to EntitlementTier.Free once the paywall is ready to actually
// gate features again.
export const useEntitlementStore = create<EntitlementState>()((set) => ({
  tier: EntitlementTier.AutoMultiPoint,
  isReady: false,
  setTier: (tier: EntitlementTier) => set({ tier }),
  setIsReady: (isReady: boolean) => set({ isReady }),
}));

/**
 * Maps a RevenueCat CustomerInfo's active entitlements onto our tier ladder
 * and applies the result to the store. Shared by the boot-time initializer
 * (useInitializeEntitlement) and the paywall's purchase/restore callbacks -
 * both need to resolve the exact same CustomerInfo -> tier logic.
 */
export const applyCustomerInfo = (customerInfo: CustomerInfo): void => {
  const { active } = customerInfo.entitlements;
  const { setTier } = useEntitlementStore.getState();

  if (active[ENTITLEMENT_IDENTIFIERS[EntitlementTier.AutoMultiPoint]]) {
    setTier(EntitlementTier.AutoMultiPoint);
  } else if (active[ENTITLEMENT_IDENTIFIERS[EntitlementTier.Auto4Point]]) {
    setTier(EntitlementTier.Auto4Point);
  } else {
    setTier(EntitlementTier.Free);
  }
};
