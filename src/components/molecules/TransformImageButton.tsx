import { CircleTextButton } from '@atoms';
import { router } from 'expo-router';

export const TransformImageButton: React.FC = () => {
  const onTransformImagePress = async () => {
    router.push('/transform');
  };

  return (
    <CircleTextButton
      key={'transform-image'}
      accessibilityLabel={'Go'}
      onPress={onTransformImagePress}
      disabled={false}
      title={'Go'}
      fontSize={22}
    />
  );
};
