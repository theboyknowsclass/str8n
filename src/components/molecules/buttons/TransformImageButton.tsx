import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

/**
 * TransformImageButton component that initiates image transformation.
 *
 * This component renders a button with a transform icon that navigates
 * to the transform page when pressed. It's used in the edit interface
 * to start the image processing workflow.
 *
 * @returns JSX element containing the transform image button
 *
 * @example
 * ```typescript
 * <TransformImageButton />
 * ```
 */
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
