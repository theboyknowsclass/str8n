import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';
import { Page } from '../../../types/Pages';

export const SettingsButton: React.FC = () => {
  const { navigate } = useNavigation();

  const onSettingsButtonPress = () => {
    navigate(Page.SETTINGS);
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
