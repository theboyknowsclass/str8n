import { IconButton } from '@atoms';
import { ImagePickerService } from '@services';
import { useOverlayStore, useSourceImageStore } from '@stores';
import { router } from 'expo-router';

export const ImagePickerButton: React.FC = () => {
  const { isLoading, setLoading, setSourceImage } = useSourceImageStore();
  const { resetPoints } = useOverlayStore();

  const onStartPress = async () => {
    setLoading(true);
    try {
      const { success, error, data } = await ImagePickerService.selectImage();
      if (success && data) {
        resetPoints();
        setSourceImage(data);
        router.navigate('edit');
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
