import { Instructions } from '@organisms';
import { useSessionStateStore } from '@stores';
import { ModalPageTemplate } from '@templates';
import { InstructionMode } from '@types';

/**
 * Props for the InstructionsPage component.
 * @property mode - The instruction mode to display (IMPORT, EDIT, EXPORT, or ALL)
 * @property showSteps - Whether to show step-by-step instructions or just the current mode
 */
interface InstructionsPageProps {
  mode: InstructionMode;
  showSteps: boolean;
}

/**
 * Instructions page component that displays user guidance.
 *
 * This component shows contextual instructions based on the current app mode
 * and user progress. It can display either step-by-step guidance or mode-specific
 * instructions. When closed, it marks instructions as dismissed for the session.
 *
 * @param props - InstructionsPageProps containing mode and showSteps configuration
 * @returns JSX element containing the instructions modal
 *
 * @example
 * ```typescript
 * <InstructionsPage mode={InstructionMode.EDIT} showSteps={false} />
 * ```
 */
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
