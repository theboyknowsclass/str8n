import { Instruction } from '@types';
import { InstructionRow } from './InstructionRow';
import { Text } from '@atoms';

/**
 * Utility function that converts instructions into React nodes for rendering.
 *
 * This function takes an array of instructions and converts them into React nodes
 * that can be rendered. It supports two modes: simple list (when showSteps is false)
 * and grouped steps (when showSteps is true) with step titles.
 *
 * @param instructions - Array of Instruction objects to convert
 * @param showSteps - Boolean indicating whether to group instructions into steps
 * @param titleColor - Color for the step titles when grouping is enabled
 * @returns Array of React nodes representing the instructions
 *
 * @example
 * ```typescript
 * const instructionNodes = getInstructionRows(instructions, true, '#FF0000');
 * ```
 */
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
