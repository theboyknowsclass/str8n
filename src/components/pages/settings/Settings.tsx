import { SettingsToggle, SettingsNavigationRow } from '@molecules';
import { ModalPageTemplate } from '@templates';
import { usePersistedSettingsStore, useEntitlementStore } from '@stores';
import { ENTITLEMENT_TIER_LABELS } from '@types';
import { useNavigation } from '@hooks';
import { StyleSheet, View } from 'react-native';

/**
 * Settings page component that allows users to configure app preferences.
 *
 * This component displays user-configurable settings in a modal layout.
 * Currently includes options for image processing behavior like cropping
 * to overlay boundaries. Settings are automatically persisted to storage.
 *
 * @returns JSX element containing the settings configuration interface
 *
 * @example
 * ```typescript
 * <Settings />
 * ```
 */
export const Settings: React.FC = () => {
  const {
    cropToOverlay,
    setCropToOverlay,
    alwaysShowInstructions,
    setAlwaysShowInstructions,
    showZoomView,
    setShowZoomView,
  } = usePersistedSettingsStore();
  const { tier } = useEntitlementStore();
  const { navigate } = useNavigation();

  return (
    <ModalPageTemplate title="Settings">
      <View style={styles.contentContainer}>
        <View style={styles.settingsContainer}>
          <SettingsNavigationRow
            title="Subscription"
            value={ENTITLEMENT_TIER_LABELS[tier]}
            onPress={() => navigate('paywall')}
          />
          <SettingsToggle
            title="Crop to overlay polygon on transform"
            isEnabled={cropToOverlay}
            onToggle={setCropToOverlay}
          />
          <SettingsToggle
            title="Show zoom view when moving points"
            isEnabled={showZoomView}
            onToggle={setShowZoomView}
          />
          <SettingsToggle
            title="Always show instructions on startup"
            isEnabled={alwaysShowInstructions}
            onToggle={setAlwaysShowInstructions}
          />
        </View>
      </View>
    </ModalPageTemplate>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    width: '100%',
    height: '100%',
    marginTop: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    height: '100%',
  },
});
