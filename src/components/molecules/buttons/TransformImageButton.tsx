import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';
import { useEditControlContext } from '@contexts';
import { useOverlayStore } from '@stores';
import { orderPointsByCorner } from '@utils/transformUtils';

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
  const { selectionPoints } = useEditControlContext();
  const { setPoints } = useOverlayStore();

  const onTransformImagePress = async () => {
    setPoints(
      orderPointsByCorner(
        selectionPoints.map((p) => ({
          x: p.x.value,
          y: p.y.value,
        }))
      )
    );
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
