import { Instruction } from '@types';
import { InstructionRow } from './InstructionRow';
import { Text } from '@atoms';

export const getInstructionRows = (
  instructions: Instruction[],
  showSteps: boolean,
  titleColor: string
): React.ReactNode[] => {
  if (!showSteps) {
    return instructions.map((instruction) => {
      return (
        <InstructionRow
          key={`instruction-${instruction.icon}`}
          {...instruction}
        />
      );
    });
  }

  type InstructionGroup = {
    [key: string]: Instruction[];
  };

  const groupedInstructions = instructions.reduce(
    (result: InstructionGroup, currentValue: Instruction) => {
      (result[currentValue.group] = result[currentValue.group] || []).push(
        currentValue
      );
      return result;
    },
    {}
  );

  const result: React.ReactNode[] = [];

  Object.entries(groupedInstructions).forEach(
    ([group, groupInstructions], i) => {
      result.push(
        <Text
          size="large"
          color={titleColor}
          style={{ flexShrink: 1, textAlign: 'left', paddingTop: 16 }}
          key={`instruction-title-${i}`}
        >
          {`Step ${i + 1}`}
        </Text>
      );
      groupInstructions.forEach((instruction) => {
        result.push(
          <InstructionRow
            key={`instruction-${instruction.icon}`}
            {...instruction}
          />
        );
      });
    }
  );

  return result;
};
