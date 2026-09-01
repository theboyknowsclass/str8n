import React from 'react';
import { usePathname } from 'expo-router';
import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

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
  const pathname = usePathname();

  const onBackPress = () => {
    goBack();
  };

  // router.canGoBack() reflects expo-router's history stack, which can have
  // entries behind the home screen (e.g. after navigate('import') pushes a
  // fresh '/' on top of an existing 'edit' entry rather than popping back to
  // it) - showing "back" there would return the user to a stale previous
  // session's screen. The home/import page should never show a back button
  // regardless of what the history stack looks like. Checked against the
  // actual route pathname rather than the session store's currentPage field,
  // since that field isn't synchronized by goBack() (only by navigate()) and
  // can go stale after navigating back via the button itself.
  // src/app/index.tsx re-exports src/app/import.tsx's route component, so
  // '/' and '/import' are both legitimate, separately-reachable pathnames
  // for the same home screen - both need to count as "home" here.
  const isHomeScreen = pathname === '/' || pathname === '/import';
  const showBackButton = !isHomeScreen && canGoBack();

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
