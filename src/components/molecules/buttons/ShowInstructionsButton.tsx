import { CircleTextButton } from '@atoms';
import { useNavigation } from '@hooks';

export const ShowInstructionsButton: React.FC = () => {
  const { navigate } = useNavigation();

  const onShowInstructionsPress = async () => {
    navigate('instructions');
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
