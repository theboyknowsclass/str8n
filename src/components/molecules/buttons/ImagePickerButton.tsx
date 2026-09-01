import { IconButton } from '@atoms';
import { ImagePickerService } from '@services';
import { useSourceImageStore } from '@stores';
import { useAutoDetectCorners, useNavigation } from '@hooks';

/**
 * ImagePickerButton component that allows users to select images from their library.
 *
 * This component renders a button that opens the device's image picker when pressed.
 * It handles the image selection process, updates the source image store, sets the
 * overlay's initial corner points (automatically detected or the manual default,
 * depending on subscription tier - see useAutoDetectCorners), and navigates to the
 * edit page upon successful selection.
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
  const { detectCorners } = useAutoDetectCorners();
  const { navigate } = useNavigation();

  const onStartPress = async () => {
    setLoading(true);
    try {
      const { success, error, data } = await ImagePickerService.selectImage();
      if (success && data) {
        await detectCorners(data);
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
