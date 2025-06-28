import { Instruction, InstructionMode } from '@types';
import { useScreenDimensions } from '@hooks/useScreenDimensions';

/**
 * Hook that provides instructions based on the current instruction mode.
 *
 * This hook generates a list of instructions appropriate for the current
 * context (import, edit, or export mode) and adapts the text and icons
 * based on the device type (mobile vs desktop).
 *
 * @param mode - The instruction mode that determines which instructions to show
 * @returns Array of Instruction objects for the current mode and device type
 *
 * @example
 * ```typescript
 * const instructions = useInstructions(InstructionMode.EDIT);
 * ```
 */
export function useInstructions(mode: InstructionMode): Instruction[] {
  const { isMobile } = useScreenDimensions();
  const instructions: Instruction[] = [];

  if (mode & InstructionMode.IMPORT) {
    instructions.push({
      group: 1,
      icon: 'photo-library',
      text: 'press to choose an image from your library',
    });
  }

  if (mode & InstructionMode.EDIT) {
    instructions.push({
      group: 2,
      icon: 'gesture-tap-hold',
      text: 'tap and hold on a point to move it',
    });
    instructions.push({
      group: 2,
      icon: 'gesture-swipe',
      text: isMobile ? 'swipe to pan the view' : 'drag to pan the view',
    });
    instructions.push({
      group: 2,
      icon: 'gesture-spread',
      text: isMobile ? 'pinch to zoom in and out' : 'scroll to zoom in and out',
    });
    instructions.push({
      group: 2,
      icon: 'transform',
      text: 'transform the image',
    });
  }

  if (mode & InstructionMode.EXPORT) {
    instructions.push({
      group: 3,
      icon: isMobile ? 'share' : 'file-download',
      text: isMobile ? 'share the image' : 'download the image',
    });
  }

  return instructions;
}
