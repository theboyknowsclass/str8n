import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';
import { Page } from '../../../types/Pages';

export const TransformImageButton: React.FC = () => {
  const { navigate } = useNavigation();

  const onTransformImagePress = async () => {
    navigate(Page.TRANSFORM);
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
