import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import Purchases, { PurchasesOffering } from 'react-native-purchases';
import RevenueCatUI from 'react-native-purchases-ui';
import { ModalPageTemplate } from '@templates';
import { LoadingSpinner, Text } from '@atoms';
import { applyCustomerInfo, useEntitlementStore } from '@stores';
import { useNavigation } from '@hooks';
import { getNextTierOfferingIdentifier } from '@types';

/**
 * iOS implementation of the Paywall page (see the generic Paywall.tsx for
 * every other platform). Renders RevenueCat's prebuilt full-screen paywall
 * template directly (not wrapped in ModalPageTemplate's own header/close
 * bar - the paywall template already provides its own close button and
 * branding, and doubling that chrome would look redundant) once a
 * RevenueCat API key is configured; otherwise falls back to the same
 * "not available yet" message the generic version shows, since rendering a
 * native paywall RevenueCat was never configured to serve would fail.
 *
 * Kept as a separate platform file (rather than a Platform.OS branch in one
 * shared file) so that 'react-native-purchases-ui' is never imported into
 * the web/Android bundle at all, not merely unused at runtime there.
 *
 * @returns JSX element containing the paywall
 *
 * @example
 * ```typescript
 * <Paywall />
 * ```
 */
export const Paywall: React.FC = () => {
  const { dismiss } = useNavigation();
  const { tier } = useEntitlementStore();

  const apiKey = Constants.expoConfig?.extra?.revenueCat?.iosApiKey;

  // Undefined (not yet loaded) vs null (loaded, but no matching offering
  // found - e.g. not configured in RevenueCat yet) are distinct: undefined
  // means "still fetching, don't render the paywall yet", null means "go
  // ahead and render RevenueCatUI.Paywall with no offering prop", which
  // falls back to whatever offering is marked Current in the dashboard.
  const [offering, setOffering] = useState<
    PurchasesOffering | null | undefined
  >(undefined);

  useEffect(() => {
    if (!apiKey) {
      return;
    }

    let isCancelled = false;
    const targetIdentifier = getNextTierOfferingIdentifier(tier);

    Purchases.getOfferings()
      .then((offerings) => {
        if (!isCancelled) {
          setOffering(offerings.all[targetIdentifier] ?? null);
        }
      })
      .catch((error) => {
        console.error('Error loading offerings for paywall', error);
        if (!isCancelled) {
          setOffering(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [apiKey, tier]);

  if (!apiKey) {
    return (
      <ModalPageTemplate title="Upgrade" onClose={dismiss}>
        <Text style={styles.unavailableText}>
          Subscriptions are available on iOS for now.
        </Text>
      </ModalPageTemplate>
    );
  }

  if (offering === undefined) {
    return (
      <ModalPageTemplate title="Upgrade" onClose={dismiss}>
        <LoadingSpinner size={40} animating={true} />
      </ModalPageTemplate>
    );
  }

  return (
    <RevenueCatUI.Paywall
      style={styles.paywall}
      options={{ offering: offering ?? undefined }}
      onPurchaseCompleted={({ customerInfo }) => {
        applyCustomerInfo(customerInfo);
        dismiss();
      }}
      onRestoreCompleted={({ customerInfo }) => {
        applyCustomerInfo(customerInfo);
        dismiss();
      }}
      onDismiss={dismiss}
    />
  );
};

const styles = StyleSheet.create({
  paywall: {
    flex: 1,
  },
  unavailableText: {
    marginTop: 32,
    textAlign: 'center',
  },
});
