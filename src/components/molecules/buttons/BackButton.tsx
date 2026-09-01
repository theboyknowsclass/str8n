import React from 'react';
import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';
import { useSessionStateStore } from '@stores';

/**
 * Props for the BackButton component.
 * @property size - Optional size variant for the button ('small' or 'large')
 * @property showBorder - Optional boolean to control border visibility
 */
interface BackButtonProps {
  size?: 'small' | 'large';
  showBorder?: boolean;
}

/**
 * BackButton component that provides navigation back functionality.
 *
 * This component renders a button with a back arrow icon that navigates
 * to the previous screen when pressed. It only renders when navigation
 * back is possible, providing a clean conditional display.
 *
 * @param props - BackButtonProps containing size and border options
 * @returns JSX element containing the back button or null if can't go back
 *
 * @example
 * ```typescript
 * <BackButton size="large" showBorder={true} />
 * ```
 */
export const BackButton: React.FC<BackButtonProps> = ({ ...props }) => {
  const { goBack, canGoBack } = useNavigation();
  const { currentPage } = useSessionStateStore();

  const onBackPress = () => {
    goBack();
  };

  // router.canGoBack() reflects expo-router's history stack, which can have
  // entries behind the home screen (e.g. after navigate('import') pushes a
  // fresh '/' on top of an existing 'edit' entry rather than popping back to
  // it) - showing "back" there would return the user to a stale previous
  // session's screen. The home/import page should never show a back button
  // regardless of what the history stack looks like.
  const showBackButton = currentPage !== 'import' && canGoBack();

  return showBackButton ? (
    <IconButton
      {...props}
      icon="arrow-back"
      onPress={onBackPress}
      accessibilityLabel="Go Back"
      title=""
    />
  ) : null;
};
