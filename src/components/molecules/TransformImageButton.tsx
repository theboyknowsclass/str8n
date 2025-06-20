import { CircleTextButton, IconButton } from '@atoms';
import { router } from 'expo-router';

export const TransformImageButton: React.FC = () => {
  const onTransformImagePress = async () => {
    router.push('/transform');
  };

  return (
    <IconButton
      icon="transformed"
      onPress={onTransformImagePress}
      accessibilityLabel={'Transform Image'}
      title=""
    />
  );

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
