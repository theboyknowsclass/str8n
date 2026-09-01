import { StyleSheet } from 'react-native';
import { ModalPageTemplate } from '@templates';
import { Text } from '@atoms';
import { useNavigation } from '@hooks';

/**
 * Non-iOS implementation of the Paywall page (see Paywall.ios.tsx for the
 * real RevenueCat-backed one). Paid tiers are iOS-only for now - RevenueCat
 * has no web purchase path, and Android hasn't been submitted to the Play
 * Store yet - so every other platform shows this simple message instead.
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

  return (
    <ModalPageTemplate title="Upgrade" onClose={dismiss}>
      <Text style={styles.unavailableText}>
        Subscriptions are available on iOS for now.
      </Text>
    </ModalPageTemplate>
  );
};

const styles = StyleSheet.create({
  unavailableText: {
    marginTop: 32,
    textAlign: 'center',
  },
});
