import { useLocalSearchParams } from 'expo-router';
import { Instructions } from '../components/organisms/Instructions/Instructions';
import { ModalPageTemplate } from '@templates';
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
    <ModalPageTemplate title="Instructions">
      <Instructions mode={instructionMode} showSteps={shouldShowSteps} />
    </ModalPageTemplate>
  );
};

export default InstructionsRoute;
