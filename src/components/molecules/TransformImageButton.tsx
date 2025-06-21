import { IconButton } from '@atoms';
import { router } from 'expo-router';

export const TransformImageButton: React.FC = () => {
  const onTransformImagePress = async () => {
    router.push('/transform');
  };

  return (
    <IconButton
      icon="transform"
      onPress={onTransformImagePress}
      accessibilityLabel={'Transform Image'}
      title=""
    />
  );
};
