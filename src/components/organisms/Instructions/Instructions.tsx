import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';
import { InstructionMode } from '@types';
import { InstructionRow } from './InstructionRow';
import { useInstructions } from './useInstructions';
import { AlwaysShowToggleSwitch } from './AlwaysShowToggleSwitch';

interface InstructionsProps {
  mode: InstructionMode;
  onClosePress: () => void;
}

export const Instructions: React.FC<InstructionsProps> = ({
  mode = InstructionMode.ALL,
  onClosePress,
}) => {
  const { colors } = useTheme();
  const instructions = useInstructions(mode);

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
      {instructions.map((instruction) => (
        <InstructionRow key={instruction.icon} {...instruction} />
      ))}

      {mode === InstructionMode.ALL && (
        <View style={styles.footerRow}>
          <AlwaysShowToggleSwitch />
        </View>
      )}
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
  footerRow: {
    marginTop: 32,
    alignItems: 'center',
  },
});
