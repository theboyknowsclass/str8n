import { EntitlementTier } from '@types';
import { create } from 'zustand';

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
export const useEntitlementStore = create<EntitlementState>()((set) => ({
  tier: EntitlementTier.Free,
  isReady: false,
  setTier: (tier: EntitlementTier) => set({ tier }),
  setIsReady: (isReady: boolean) => set({ isReady }),
}));
