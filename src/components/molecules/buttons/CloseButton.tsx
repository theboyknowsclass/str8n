import React from 'react';
import { router } from 'expo-router';
import { IconButton } from '@atoms';

interface CloseButtonProps {
  onPress?: () => void;
}

/**
 * A button component that allows users to go back to the previous screen.
 * Uses the Button component with an icon variant for consistent styling.
 */
export const CloseButton: React.FC<CloseButtonProps> = ({
  onPress,
  ...props
}) => {
  const close = () => {
    router.dismiss();
    onPress?.();
  };

  const showCloseButton = router.canGoBack();

  return showCloseButton ? (
    <IconButton
      {...props}
      icon="close"
      onPress={close}
      accessibilityLabel="Close"
      title=""
    />
  ) : null;
};
