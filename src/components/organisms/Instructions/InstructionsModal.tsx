import { useAutoShowInstructions, usePageModalContext } from '@hooks';
import { useSessionStateStore } from '@stores';
import { ModalDialog } from '@molecules';
import { Instructions } from './Instructions';
import { InstructionMode } from '@types';

interface InstructionsModalProps {
  mode: InstructionMode;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  mode,
}) => {
  const { isModalVisible, setIsModalVisible } = usePageModalContext();
  const { setHasDismissedInstructions } = useSessionStateStore();

  useAutoShowInstructions();

  const onClosePress = () => {
    setIsModalVisible(false);
    setHasDismissedInstructions(true);
  };

  const showTitle = mode === InstructionMode.ALL;
  const title = showTitle ? 'Instructions' : undefined;

  return (
    <ModalDialog
      isVisible={isModalVisible}
      title={title}
      onClose={onClosePress}
    >
      <Instructions mode={mode} />
    </ModalDialog>
  );
};
