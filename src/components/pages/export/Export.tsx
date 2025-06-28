import React from 'react';
import { useTransformedImageStore } from '@stores';
import { Image } from 'react-native';
import { PageTemplate } from '@templates';
import { DownloadButton, ShareButton } from '@molecules';
import { useScreenDimensions } from '@hooks';
import { InstructionsModal } from '@organisms';
import { InstructionMode } from '@types';

/**
 * Export page component that displays the transformed image.
 *
 * This component shows the final transformed image with options to download (desktop)
 * or share (mobile) the result. It includes instruction modal support and
 * responsive behavior based on device type.
 *
 * @returns JSX element containing the export page layout
 * @returns null if no transformed image is available
 *
 * @example
 * ```typescript
 * <Export />
 * ```
 */
export const Export: React.FC = () => {
  const { destinationUri } = useTransformedImageStore();
  const { isMobile } = useScreenDimensions();
  if (!destinationUri) return null;

  return (
    <PageTemplate>
      <PageTemplate.ModalContent>
        <InstructionsModal mode={InstructionMode.EXPORT} />
      </PageTemplate.ModalContent>
      <PageTemplate.ActionItems>
        {isMobile ? (
          <ShareButton key="share-button" />
        ) : (
          <DownloadButton key="download-button" />
        )}
      </PageTemplate.ActionItems>
      <Image
        source={{ uri: destinationUri }}
        style={{
          width: '100%',
          height: '100%',
        }}
        resizeMode="contain"
      />
    </PageTemplate>
  );
};
