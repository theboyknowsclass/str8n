import React from 'react';
import { IconButton } from '@atoms';
import { useShareImage } from '@hooks';

/**
 * ShareButton component that allows users to share the transformed image.
 *
 * This component renders a button with a share icon that initiates the image
 * sharing process when pressed. It handles loading states and availability
 * of sharing functionality, automatically disabling when sharing is not
 * available or in progress.
 *
 * @returns JSX element containing the share button
 *
 * @example
 * ```typescript
 * <ShareButton />
 * ```
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
