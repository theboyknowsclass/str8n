import { IconType, InstructionMode } from '@types';
import { useScreenDimensions } from '@hooks/useScreenDimensions';

interface InstructionRowProps {
  icon: IconType;
  text: string;
}

export function useInstructions(mode: InstructionMode): InstructionRowProps[] {
  const { isMobile } = useScreenDimensions();
  const instructions: InstructionRowProps[] = [];

  if (mode & InstructionMode.IMPORT) {
    instructions.push({
      icon: 'photo-library',
      text: 'press to choose an image from your library',
    });
  }

  if (mode & InstructionMode.EDIT) {
    instructions.push({
      icon: 'gesture-tap-hold',
      text: 'tap and hold on a point to move it',
    });
    instructions.push({
      icon: 'gesture-swipe',
      text: isMobile ? 'swipe to pan the view' : 'drag to pan the view',
    });
    instructions.push({
      icon: 'gesture-spread',
      text: isMobile ? 'pinch to zoom in and out' : 'scroll to zoom in and out',
    });
    instructions.push({
      icon: 'transform',
      text: 'transform the image',
    });
  }

  if (mode & InstructionMode.EXPORT) {
    instructions.push({
      icon: isMobile ? 'share' : 'file-download',
      text: isMobile ? 'share the image' : 'download the image',
    });
  }

  return instructions;
}
