import { Instruction, InstructionMode } from '@types';
import { useScreenDimensions } from '@hooks/useScreenDimensions';

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
