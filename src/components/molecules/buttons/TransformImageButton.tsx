import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

export const TransformImageButton: React.FC = () => {
  const { navigate } = useNavigation();

  const onTransformImagePress = async () => {
    navigate('transform');
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
