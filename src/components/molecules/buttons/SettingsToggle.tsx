import { Switch, Text } from '@atoms';
import { useTheme } from 'expo-router/react-navigation';
import { View, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

/**
 * Props for the SettingsToggle component.
 * @property title - The text label displayed next to the toggle switch
 * @property isEnabled - Boolean indicating the current state of the toggle
 * @property onToggle - Callback function called when the toggle state changes
 */
interface SettingsToggleProps {
  title: string;
  isEnabled: boolean;
  onToggle: (value: boolean) => void;
}

/**
 * SettingsToggle component that provides a toggle switch for settings.
 *
 * This component renders an animated toggle switch with a text label for
 * boolean settings. It uses theme colors for consistent styling and
 * provides smooth animations when the toggle state changes.
 *
 * @param props - SettingsToggleProps containing title, state, and toggle callback
 * @returns JSX element containing the settings toggle with label
 *
 * @example
 * ```typescript
 * <SettingsToggle
 *   title="Crop to overlay"
 *   isEnabled={cropToOverlay}
 *   onToggle={setCropToOverlay}
 * />
 * ```
 */
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
      <Switch onPress={onPress} value={value} />
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
