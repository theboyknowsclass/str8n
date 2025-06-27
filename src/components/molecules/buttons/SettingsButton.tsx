import { IconButton } from '@atoms';
import { useNavigation } from '../../../hooks/useNavigation';

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
