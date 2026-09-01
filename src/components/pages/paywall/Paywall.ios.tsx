import { StyleSheet } from 'react-native';
import Constants from 'expo-constants';
import RevenueCatUI from 'react-native-purchases-ui';
import { ModalPageTemplate } from '@templates';
import { Text } from '@atoms';
import { applyCustomerInfo } from '@stores';
import { useNavigation } from '@hooks';

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

  const apiKey = Constants.expoConfig?.extra?.revenueCat?.iosApiKey;

  if (!apiKey) {
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
