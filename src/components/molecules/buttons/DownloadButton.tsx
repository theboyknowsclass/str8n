import React from 'react';
import { IconButton } from '@atoms';
import { useDownloadImage } from '@hooks';
import { useTransformedImageStore } from '@stores';

/**
 * DownloadButton component that allows users to download the transformed image.
 *
 * This component renders a button with a download icon that initiates the image
 * download process when pressed. It checks for the availability of a transformed
 * image before attempting to download and uses a default filename.
 *
 * @returns JSX element containing the download button
 *
 * @example
 * ```typescript
 * <DownloadButton />
 * ```
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
