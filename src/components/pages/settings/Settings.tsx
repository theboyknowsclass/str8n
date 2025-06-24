import { SettingsToggle } from '@molecules';
import { ModalPageTemplate } from '@templates';
import { usePersistedSettingsStore } from '@stores';
import { StyleSheet, View } from 'react-native';

export const Settings: React.FC = () => {
  const { cropToOverlay, setCropToOverlay } = usePersistedSettingsStore();

  return (
    <ModalPageTemplate
    >
      <View style={styles.contentContainer}>
        <SettingsToggle
          title="Crop to overlay"
          isEnabled={cropToOverlay}
          onToggle={setCropToOverlay}
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
  },
});
