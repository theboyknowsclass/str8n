import { AnimatedSwitch, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';
import { View, StyleSheet, Platform } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

interface SettingsToggleProps {
  title: string;
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
}

export const SettingsToggle: React.FC<SettingsToggleProps> = ({
  title,
  isEnabled,
  onToggle,
}) => {
  const {
    colors: { primary },
  } = useTheme();

  const value = useSharedValue(isEnabled);

  const onPress = () => {
    onToggle(value.value);
  };

  return (
    <View style={styles.toggleContainer}>
      <AnimatedSwitch onPress={onPress} value={value} />
      <Text color={primary} style={styles.toggleText}>
        {title}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  toggleContainer: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  toggleText: {
    flexShrink: 0,
    textAlign: 'left',
    position: 'relative',
    top: -0.5,
  },
});
