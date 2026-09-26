import { IconButton } from '@atoms';
import { ImagePickerService } from '@services';
import { useOverlayStore, useSourceImageStore } from '@stores';
import { useNavigation } from '@hooks';

/**
 * ImagePickerButton component that allows users to select images from their library.
 *
 * This component renders a button that opens the device's image picker when pressed.
 * It handles the image selection process, updates the source image store, resets the
 * overlay to its default manual corners, and navigates to the edit page upon
 * successful selection. Auto-detection is a separate, on-demand action from the
 * Edit screen (see AutoDetectButton) rather than running automatically here - it
 * involves a real CV processing delay, so picking an image should feel instant
 * rather than making the user wait on it before they can even see their photo.
 *
 * @returns JSX element containing the image picker button
 *
 * @example
 * ```typescript
 * <ImagePickerButton />
 * ```
 */
export const ImagePickerButton: React.FC = () => {
  const { isLoading, setLoading, setSourceImage } = useSourceImageStore();
  const { resetPoints } = useOverlayStore();
  const { navigate } = useNavigation();

  const onStartPress = async () => {
    setLoading(true);
    try {
      const { success, error, data } = await ImagePickerService.selectImage();
      if (success && data) {
        resetPoints();
        setSourceImage(data);
        navigate('edit');
        return;
      }
      console.warn(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <IconButton
      accessibilityLabel="Pick an image from the library"
      icon="photo-library"
      onPress={onStartPress}
      loading={isLoading}
    />
  );
};
