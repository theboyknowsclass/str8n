import { useLocalSearchParams } from 'expo-router';
import { InstructionsPage } from '@pages';
import { InstructionMode } from '@types';

export const InstructionsRoute: React.FC = () => {
  const { mode, showSteps } = useLocalSearchParams<{
    mode?: string;
    showSteps?: string;
  }>();

  // Parse the mode parameter, defaulting to ALL if not provided or invalid
  const instructionMode = mode ? parseInt(mode, 10) : InstructionMode.ALL;

  // Parse the showSteps parameter, defaulting to true if not provided
  const shouldShowSteps = showSteps !== 'false';

  return (
    <InstructionsPage mode={instructionMode} showSteps={shouldShowSteps} />
  );
};

export default InstructionsRoute;
