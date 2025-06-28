import React from 'react';
import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

/**
 * Props for the CloseButton component.
 * @property onPress - Optional callback function called after the default close action
 */
interface CloseButtonProps {
  onPress?: () => void;
}

/**
 * CloseButton component that provides a standardized close action.
 *
 * This component renders a button with a close icon that dismisses the current
 * modal or navigates back. It combines the default navigation dismiss action
 * with an optional custom onPress callback for additional functionality.
 *
 * @param props - CloseButtonProps containing optional onPress callback
 * @returns JSX element containing the close button
 *
 * @example
 * ```typescript
 * <CloseButton onPress={handleCustomClose} />
 * ```
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
