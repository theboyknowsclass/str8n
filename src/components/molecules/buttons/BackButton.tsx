import React from 'react';
import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

interface BackButtonProps {
  size?: 'small' | 'large';
  showBorder?: boolean;
}

/**
 * A button component that allows users to go back to the previous screen.
 * Uses the Button component with an icon variant for consistent styling.
 */
export const BackButton: React.FC<BackButtonProps> = ({ ...props }) => {
  const { goBack, canGoBack } = useNavigation();

  const back = () => {
    goBack();
  };

  const showBackButton = canGoBack();

  return showBackButton ? (
    <IconButton
      {...props}
      icon="arrow-back"
      onPress={back}
      accessibilityLabel="Go Back"
      title=""
    />
  ) : null;
};
