import { usePageModalContext } from '@contexts';
import { useSessionStateStore } from '@stores';
import { ModalDialog } from '@molecules';
import { Instructions } from './Instructions';
import { InstructionMode } from '@types';

/**
 * Props for the InstructionsModal component.
 * @property mode - The instruction mode that determines which instructions to show and their presentation
 */
interface InstructionsModalProps {
  /** The instruction mode that determines which instructions to show and their presentation */
  mode: InstructionMode;
}

/**
 * InstructionsModal component that displays instructions in a modal dialog.
 *
 * This component wraps the Instructions component in a modal dialog and handles
 * the modal visibility state. It automatically shows instructions when appropriate
 * and tracks when the user has dismissed instructions to avoid showing them again.
 *
 * Features:
 * - Modal dialog presentation with consistent styling
 * - Automatic instruction dismissal tracking
 * - Mode-based instruction content selection
 * - Integration with page modal context for visibility management
 * - Session state persistence for dismissed instructions
 * - Conditional title display based on instruction mode
 *
 * @param props - InstructionsModalProps containing the instruction mode
 * @returns JSX element containing the instructions modal
 *
 * @example
 * ```typescript
 * // Show all instructions
 * <InstructionsModal mode={InstructionMode.ALL} />
 *
 * // Show specific instruction mode
 * <InstructionsModal mode={InstructionMode.EDIT} />
 * ```
 */
export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  mode,
}) => {
  const { isModalVisible, setIsModalVisible } = usePageModalContext();
  const { setHasDismissedInstructions } = useSessionStateStore();

  const onClosePress = () => {
    setIsModalVisible(false);
    setHasDismissedInstructions(true);
  };

  const showTitle = mode === InstructionMode.ALL;
  const showSteps = mode === InstructionMode.ALL;
  const title = showTitle ? 'Instructions' : undefined;

  return (
    <ModalDialog
      isVisible={isModalVisible}
      title={title}
      onClose={onClosePress}
    >
      <Instructions mode={mode} showSteps={showSteps} />
    </ModalDialog>
  );
};
