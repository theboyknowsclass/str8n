import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

/**
 * SettingsButton component that navigates to the settings page.
 *
 * This component renders a button with a settings icon that navigates
 * to the settings page when pressed. It's used in the navigation bar
 * to provide quick access to app configuration.
 *
 * @returns JSX element containing the settings button
 *
 * @example
 * ```typescript
 * <SettingsButton />
 * ```
 */
export const SettingsButton: React.FC = () => {
  const { navigate } = useNavigation();

  const onSettingsButtonPress = () => {
    navigate('settings');
  };

  return (
    <IconButton
      icon="settings"
      onPress={onSettingsButtonPress}
      accessibilityLabel="Settings"
      title=""
    />
  );
};
