import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';
import { usePersistedSettingsStore } from '@stores';
import { SettingsToggle } from '@molecules';
import { IconType } from '@types';
import { useScreenDimensions } from '@hooks';

interface InstructionsProps {
  mode: 'import' | 'edit';
  onClosePress: () => void;
}

interface InstructionRowProps {
  icon: IconType;
  text: string;
}

export const InstructionRow: React.FC<InstructionRowProps> = ({
  icon,
  text,
}) => {
  const { colors } = useTheme();

  const iconStyle = {
    borderColor: colors.primary,
  };

  return (
    <View style={styles.contentRow}>
      <View style={[styles.iconContainer, iconStyle]}>
        <Icon name={icon} size={36} />
      </View>
      <Text
        size="medium"
        color={colors.primary}
        style={{ flexShrink: 1, textAlign: 'left' }}
      >
        {text}
      </Text>
    </View>
  );
};

export const Instructions: React.FC<InstructionsProps> = ({
  mode = 'import',
  onClosePress,
}) => {
  const { colors } = useTheme();
  const { alwaysShowInstructions, setAlwaysShowInstructions } =
    usePersistedSettingsStore();
  const { isMobile } = useScreenDimensions();
  const showChooseImage = mode === 'import';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text size="larger" color={colors.primary}>
          Instructions
        </Text>
        <IconButton
          icon="close"
          size="small"
          accessibilityLabel="Close"
          onPress={onClosePress}
        />
      </View>
      {showChooseImage && (
        <InstructionRow
          icon="photo-library"
          text="press to choose an image from your library"
        />
      )}
      <InstructionRow
        icon="gesture-tap-hold"
        text="tap and hold on a point to move it"
      />
      <InstructionRow
        icon="gesture-swipe"
        text={isMobile ? 'swipe to pan the view' : 'drag to pan the view'}
      />

      <InstructionRow
        icon={isMobile ? 'gesture-spread' : 'mouse-scroll'}
        text={
          isMobile ? 'pinch to zoom in and out' : 'scroll to zoom in and out'
        }
      />

      <InstructionRow icon="transform" text="tap to transform the image" />

      <View style={styles.footerRow}>
        <SettingsToggle
          title="show every time"
          isEnabled={alwaysShowInstructions}
          onToggle={setAlwaysShowInstructions}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    display: 'flex',
    flexDirection: 'column',
    padding: 16,
    gap: 16,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  contentRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  footerRow: {
    marginTop: 32,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 9999,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 2,
  },
});
