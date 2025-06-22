import React from 'react';
import { IconButton } from '@atoms';
import { useShareImage } from '@hooks';

/**
 * Button component for sharing the transformed image.
 * Handles loading states and availability of sharing.
 */
export const ShareButton: React.FC = () => {
  const { canShare, isSharing, shareImage } = useShareImage();

  return (
    <IconButton
      icon="share"
      accessibilityLabel="Share Image"
      onPress={shareImage}
      loading={isSharing}
      disabled={!canShare || isSharing}
    />
  );
};
