import { Instructions } from '@organisms';
import { ModalPageTemplate } from '@templates';
import { InstructionMode } from '@types';

interface InstructionsPageProps {
  mode: InstructionMode;
  showSteps: boolean;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({
  mode,
  showSteps,
}) => {
  return (
    <ModalPageTemplate title="Instructions">
      <Instructions mode={mode} showSteps={showSteps} />
    </ModalPageTemplate>
  );
};
