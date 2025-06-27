import { StyleSheet, View } from 'react-native';
import { IconButton, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';
import { Instruction, InstructionMode } from '@types';
import { InstructionRow } from './InstructionRow';
import { useInstructions } from './useInstructions';
import { AlwaysShowToggleSwitch } from './AlwaysShowToggleSwitch';

interface InstructionsProps {
  mode: InstructionMode;
  showSteps?: boolean;
  onClosePress: () => void;
}

type InstructionGroup = {
  [key: string]: Instruction[];
}

export const Instructions: React.FC<InstructionsProps> = ({
  mode = InstructionMode.ALL,
  showSteps = false,
  onClosePress,
}) => {
  const { colors } = useTheme();
  const instructions = useInstructions(mode);

  const groupedInstructions = instructions.reduce(
    (result: InstructionGroup, currentValue: Instruction) => { 
      (result[currentValue.group] = result[currentValue.group] || []).push(currentValue);
      return result;
    }, {});

  const showFooter = mode === InstructionMode.ALL;

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
      {
        showSteps ? (
          Object.entries(groupedInstructions).map(([group, instructions], i) => {
            return (
              <View key={group}>
                <Text
        size="large"
        color={colors.primary}
        style={{ flexShrink: 1, textAlign: 'left' }}
      >
        {`Step ${i + 1}`}
      </Text>
                {instructions?.map((instruction) => (
                  <InstructionRow key={instruction.icon} {...instruction} />
                ))}
              </View>
            )
          })
          ) : (
          instructions.map((instruction) => (
            <InstructionRow key={instruction.icon} {...instruction} />
          ))
        )
      }

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
