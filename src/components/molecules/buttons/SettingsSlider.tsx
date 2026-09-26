import { Text } from '@atoms';
import { useTheme } from 'expo-router/react-navigation';
import { View, StyleSheet } from 'react-native';
import Slider from '@react-native-community/slider';

/**
 * Props for the SettingsSlider component.
 * @property title - The text label displayed above the slider
 * @property value - The current value (in the minimumValue-maximumValue range)
 * @property minimumValue - The slider's lowest selectable value
 * @property maximumValue - The slider's highest selectable value
 * @property step - The increment the slider snaps to
 * @property onValueChange - Callback function called when the slider settles on a new value
 */
interface SettingsSliderProps {
  title: string;
  value: number;
  minimumValue: number;
  maximumValue: number;
  step: number;
  onValueChange: (value: number) => void;
}

/**
 * SettingsSlider component that provides a labeled slider for tuning a
 * numeric setting, with the current value shown as a percentage.
 *
 * @param props - SettingsSliderProps containing title, range, and change callback
 * @returns JSX element containing the settings slider with label
 *
 * @example
 * ```typescript
 * <SettingsSlider
 *   title="Auto-detect: edge sensitivity"
 *   value={cannySigma}
 *   minimumValue={0.1}
 *   maximumValue={0.6}
 *   step={0.01}
 *   onValueChange={setCannySigma}
 * />
 * ```
 */
export const SettingsSlider: React.FC<SettingsSliderProps> = ({
  title,
  value,
  minimumValue,
  maximumValue,
  step,
  onValueChange,
}) => {
  const {
    colors: { primary, text, border },
  } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Text color={primary} style={styles.title}>
          {title}
        </Text>
        <Text color={text}>{Math.round(value * 100)}%</Text>
      </View>
      <Slider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor={primary as string}
        maximumTrackTintColor={border as string}
        thumbTintColor={primary as string}
        accessibilityLabel={title}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    flexShrink: 1,
    flexWrap: 'wrap',
    textAlign: 'left',
    maxWidth: '85%',
  },
});
