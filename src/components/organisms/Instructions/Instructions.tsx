import { StyleSheet, View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { InstructionMode } from '@types';
import { useInstructions } from './useInstructions';
import { AlwaysShowToggleSwitch } from './AlwaysShowToggleSwitch';
import { getInstructionRows } from './utils';

/**
 * Props for the Instructions component.
 * @property mode - The instruction mode that determines which instructions to show
 * @property showSteps - Optional boolean to group instructions into numbered steps
 */
interface InstructionsProps {
  mode: InstructionMode;
  showSteps?: boolean;
}

/**
 * Instructions component that displays contextual help and guidance.
 *
 * This component renders a list of instructions appropriate for the current
 * context (import, edit, or export mode). It can display instructions as a
 * simple list or grouped into numbered steps, and includes an optional
 * toggle for always showing instructions when in ALL mode.
 *
 * @param props - InstructionsProps containing mode and display options
 * @returns JSX element containing the instructions list
 *
 * @example
 * ```typescript
 * <Instructions mode={InstructionMode.EDIT} showSteps={true} />
 * ```
 */
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
    width: '100%',
    maxHeight: '100%',
  },
  footerRow: {
    marginTop: 32,
    alignItems: 'center',
  },
});
