import { IconButton } from '@atoms';
import { usePageModalContext } from '@hooks';

export const ShowInstructionsButton: React.FC = () => {
  const { setIsModalVisible } = usePageModalContext();
  const onShowInstructionsPress = async () => {
    setIsModalVisible(true);
  };

  return (
    <IconButton
      icon="information-variant"
      onPress={onShowInstructionsPress}
      accessibilityLabel="Show instructions"
      title=""
    />
  );
};
