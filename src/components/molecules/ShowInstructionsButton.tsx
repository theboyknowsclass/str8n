import { IconButton } from '@atoms';
import { usePageTemplateContext } from '@hooks';

export const ShowInstructionsButton: React.FC = () => {
  const { setIsModalVisible } = usePageTemplateContext();
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
