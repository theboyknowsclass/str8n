import { SettingsToggle } from '@molecules';
import { ModalPageTemplate } from '@templates';
import { usePersistedSettingsStore } from '@stores';
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

  return (
    <ModalPageTemplate title="Settings">
      <View style={styles.contentContainer}>
        <SettingsToggle
          title="Crop to overlay on transform"
          isEnabled={cropToOverlay}
          onToggle={setCropToOverlay}
        />
        <SettingsToggle
          title="Show zoom view when moving corners"
          isEnabled={showZoomView}
          onToggle={setShowZoomView}
        />
        <SettingsToggle
          title="Always show instructions on startup"
          isEnabled={alwaysShowInstructions}
          onToggle={setAlwaysShowInstructions}
        />
      </View>
    </ModalPageTemplate>
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
    marginTop: 32,
  },
});
