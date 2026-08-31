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
