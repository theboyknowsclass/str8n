/**
 * The user's current subscription tier, structured as a ladder - each tier
 * includes everything the tiers below it unlock.
 * @property Free - Manual 4-point corner selection (the original, always-available feature)
 * @property Auto4Point - Adds automatic 4-point corner detection
 * @property AutoMultiPoint - Adds automatic multi-point outline detection (includes Auto4Point)
 */
export enum EntitlementTier {
  Free = 0,
  Auto4Point = 1,
  AutoMultiPoint = 2,
}

/**
 * Maps each paid tier to its RevenueCat entitlement identifier.
 * The ladder ordering (checking AutoMultiPoint before Auto4Point) is enforced
 * by whoever reads this map, since RevenueCat itself has no notion of tiers.
 */
export const ENTITLEMENT_IDENTIFIERS: Record<
  EntitlementTier.Auto4Point | EntitlementTier.AutoMultiPoint,
  string
> = {
  [EntitlementTier.Auto4Point]: 'auto_4_point',
  [EntitlementTier.AutoMultiPoint]: 'auto_multi_point',
};

/** Product-facing display label for each tier, e.g. for the Settings screen. */
export const ENTITLEMENT_TIER_LABELS: Record<EntitlementTier, string> = {
  [EntitlementTier.Free]: 'Free',
  [EntitlementTier.Auto4Point]: 'Auto 4-Point',
  [EntitlementTier.AutoMultiPoint]: 'Auto Multi-Point',
};

/**
 * Returns the RevenueCat Offering identifier for the next rung up the
 * ladder from the given tier - i.e. what the paywall should present when a
 * user at this tier opens it. Free -> Auto4Point's offering; anything else
 * (already Auto4Point, or already at the top) -> AutoMultiPoint's offering,
 * since that's the only tier left to upsell to (and RevenueCat's own
 * paywall UI already handles an "already subscribed" state gracefully if
 * the user is shown an offering for something they already own).
 *
 * Reuses the same string identifiers as ENTITLEMENT_IDENTIFIERS - Offerings
 * and Entitlements are separate namespaces in RevenueCat, so there's no
 * collision risk, and keeping the same identifier for a tier's entitlement
 * and its offering avoids a third, easy-to-drift set of magic strings.
 *
 * @param currentTier - The user's current subscription tier
 * @returns The RevenueCat Offering identifier to present the paywall with
 */
export const getNextTierOfferingIdentifier = (
  currentTier: EntitlementTier
): string => {
  if (currentTier === EntitlementTier.Free) {
    return ENTITLEMENT_IDENTIFIERS[EntitlementTier.Auto4Point];
  }
  return ENTITLEMENT_IDENTIFIERS[EntitlementTier.AutoMultiPoint];
};
