import React from 'react';
import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

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
  const { dismiss } = useNavigation();

  const close = () => {
    dismiss();
    onPress?.();
  };

  return (
    <IconButton
      {...props}
      icon="close"
      onPress={close}
      accessibilityLabel="Close"
      title=""
    />
  );
};
