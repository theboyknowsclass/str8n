import { Instructions } from '@organisms';
import { useSessionStateStore } from '@stores';
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
  const { setHasDismissedInstructions } = useSessionStateStore();

  const onClose = () => {
    setHasDismissedInstructions(true);
  };

  return (
    <ModalPageTemplate title="Instructions" onClose={onClose}>
      <Instructions mode={mode} showSteps={showSteps} />
    </ModalPageTemplate>
  );
};
