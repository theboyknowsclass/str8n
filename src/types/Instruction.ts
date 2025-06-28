import { IconType } from './IconType';

/**
 * Represents an instruction for user guidance in the application.
 * @property group - The group number for organizing related instructions
 * @property icon - The icon to display with the instruction
 * @property text - The instruction text to display to the user
 */
export type Instruction = {
  group: number;
  icon: IconType;
  text: string;
};
