import { CircleTextButton } from '@atoms';
import { usePageModalContext } from '@hooks';

export const ShowInstructionsButton: React.FC = () => {
  const { setIsModalVisible } = usePageModalContext();
  const onShowInstructionsPress = async () => {
    setIsModalVisible(true);
  };

  return (
    <CircleTextButton
      key={'show-help'}
      accessibilityLabel={'Show instructions'}
      onPress={onShowInstructionsPress}
      disabled={false}
      title={'?'}
    />
  );
};
