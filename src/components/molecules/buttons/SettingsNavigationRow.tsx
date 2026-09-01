import { Text } from '@atoms';
import { useTheme } from 'expo-router/react-navigation';
import { Pressable, View, StyleSheet } from 'react-native';

/**
 * Props for the SettingsNavigationRow component.
 * @property title - The text label for the row
 * @property value - A secondary value displayed on the right (e.g. current status)
 * @property onPress - Callback function called when the row is pressed
 */
interface SettingsNavigationRowProps {
  title: string;
  value?: string;
  onPress: () => void;
}

/**
 * SettingsNavigationRow component for a settings row that navigates elsewhere
 * when pressed, optionally showing a current-value label on the right.
 *
 * @param props - SettingsNavigationRowProps containing title, value, and press callback
 * @returns JSX element containing the settings navigation row
 *
 * @example
 * ```typescript
 * <SettingsNavigationRow title="Subscription" value="Free" onPress={() => navigate('paywall')} />
 * ```
 */
export const SettingsNavigationRow: React.FC<SettingsNavigationRowProps> = ({
  title,
  value,
  onPress,
}) => {
  const {
    colors: { primary, text },
  } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
    >
      <View style={styles.row}>
        <Text color={primary} style={styles.title}>
          {title}
        </Text>
        {value && <Text color={text}>{value}</Text>}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    flexShrink: 0,
    textAlign: 'left',
  },
});
