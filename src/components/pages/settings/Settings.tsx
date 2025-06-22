import { CloseButton, SettingsToggle } from '@molecules';
import { usePersistedSettingsStore } from '@stores';
import { View, StyleSheet } from 'react-native';

export const Settings: React.FC = () => {
  const { cropToOverlay, setCropToOverlay } = usePersistedSettingsStore();

  return (
    <View>
      <View style={styles.closeButtonContainer}>
        <CloseButton />
      </View>
      <View style={styles.container}>
        <SettingsToggle
          title="Crop to overlay"
          isEnabled={cropToOverlay}
          onToggle={setCropToOverlay}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    alignItems: 'center',
    paddingTop: 80,
    width: '100%',
    height: '100%',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
  },
});
