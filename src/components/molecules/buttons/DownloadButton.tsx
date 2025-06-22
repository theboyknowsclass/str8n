import React from 'react';
import { IconButton } from '@atoms';
import { useDownloadImage } from '@hooks/useDownloadImage.web';
import { useTransformedImageStore } from '@stores';

/**
 * A button component that allows users to download an image.
 * Uses the Button component with an icon variant for consistent styling.
 */
export const DownloadButton: React.FC = () => {
  const { downloadImage } = useDownloadImage();
  const { destinationUri } = useTransformedImageStore();

  const downloadOnPress = async () => {
    if (!destinationUri) {
      return;
    }
    await downloadImage(destinationUri, 'image.jpg');
  };

  return (
    <IconButton
      icon="file-download"
      onPress={downloadOnPress}
      accessibilityLabel="Download image"
      title=""
    />
  );
};
