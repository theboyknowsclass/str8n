import { StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { InstructionMode } from '@types';
import { useInstructions } from './useInstructions';
import { AlwaysShowToggleSwitch } from './AlwaysShowToggleSwitch';
import { getInstructionRows } from './InstructionRows';

interface InstructionsProps {
  mode: InstructionMode;
  showSteps?: boolean;
}

export const Instructions: React.FC<InstructionsProps> = ({
  mode = InstructionMode.ALL,
  showSteps = false,
}) => {
  const { colors } = useTheme();
  const instructions = useInstructions(mode);

  const showFooter = mode === InstructionMode.ALL;

  return (
    <View style={styles.container}>
      {getInstructionRows(instructions, showSteps, colors.primary)}
      {showFooter && (
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
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    overflow: 'hidden',
  },
  footerRow: {
    marginTop: 32,
    alignItems: 'center',
  },
});
