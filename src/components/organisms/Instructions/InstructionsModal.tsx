import { useAutoShowInstructions, usePageModalContext } from '@hooks';
import { useSessionStateStore } from '@stores';
import { Instructions } from './Instructions';
import { InstructionMode } from '@types';

interface InstructionsModalProps {
  mode: InstructionMode;
}

export const InstructionsModal: React.FC<InstructionsModalProps> = ({
  mode,
}) => {
  const { setIsModalVisible } = usePageModalContext();
  const { setHasDismissedInstructions } = useSessionStateStore();

  useAutoShowInstructions();

  const onClosePress = () => {
    setIsModalVisible(false);
    setHasDismissedInstructions(true);
  };

  return <Instructions mode={mode} onClosePress={onClosePress} />;
};
