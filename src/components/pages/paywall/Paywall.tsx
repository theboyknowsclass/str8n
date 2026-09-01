import { Platform, StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import RevenueCatUI from 'react-native-purchases-ui';
import { ModalPageTemplate } from '@templates';
import { Text } from '@atoms';
import { applyCustomerInfo } from '@stores';
import { useNavigation } from '@hooks';

/**
 * Paywall page component that presents the app's subscription offering.
 *
 * On iOS, with a RevenueCat API key configured, this renders RevenueCat's
 * prebuilt full-screen paywall template directly (not wrapped in
 * ModalPageTemplate's own header/close bar - the paywall template already
 * provides its own close button and branding, and doubling that chrome would
 * look redundant). On any other platform, or if no API key is configured yet
 * (e.g. local development before a RevenueCat project exists - see
 * useInitializeEntitlement, which degrades the same way), this shows a
 * simple message instead rather than rendering a native paywall RevenueCat
 * was never configured to serve.
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

  const apiKey = Constants.expoConfig?.extra?.revenueCat?.iosApiKey;
  const isPaywallAvailable = Platform.OS === 'ios' && !!apiKey;

  if (!isPaywallAvailable) {
    return (
      <ModalPageTemplate title="Upgrade" onClose={dismiss}>
        <Text style={styles.unavailableText}>
          Subscriptions are available on iOS for now.
        </Text>
      </ModalPageTemplate>
    );
  }

  return (
    <RevenueCatUI.Paywall
      style={styles.paywall}
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
