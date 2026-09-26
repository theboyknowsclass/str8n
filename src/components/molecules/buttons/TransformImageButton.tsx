import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';
import { useEditControlContext } from '@contexts';
import { useOverlayStore } from '@stores';
import { orderPointsByCorner } from '@utils/transformUtils';
import { saveCalibrationSample } from '@services';

/**
 * TransformImageButton component that initiates image transformation.
 *
 * This component renders a button with a transform icon that navigates
 * to the transform page when pressed. It's used in the edit interface
 * to start the image processing workflow.
 *
 * In dev builds, pressing it also saves the image and the corners the user
 * just finished adjusting as a detection-calibration ground-truth sample -
 * "submitting" a transform is the moment the user considers their corner
 * placement correct, which makes it a more reliable capture point than a
 * separate manual action (see saveCalibrationSample above).
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
  const { uri, imageSize, selectionPoints } = useEditControlContext();
  const { setPoints } = useOverlayStore();

  const onTransformImagePress = async () => {
    const orderedPoints = orderPointsByCorner(
      selectionPoints.map((p) => ({
        x: p.x.value,
        y: p.y.value,
      }))
    );

    if (__DEV__) {
      saveCalibrationSample(uri, imageSize, orderedPoints);
    }

    setPoints(orderedPoints);
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
