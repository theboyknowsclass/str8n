import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  Platform,
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
} from 'react-native';

/**
 * Switch component that provides themed styling consistent with the app design.
 *
 * This component extends React Native's Switch component with automatic theme
 * integration. It applies theme colors to the track and thumb, with different
 * opacity levels for light and dark themes to ensure proper contrast and visibility.
 *
 * @param props - RNSwitchProps extending React Native SwitchProps with theme integration
 * @returns JSX element containing the themed switch
 *
 * @example
 * ```typescript
 * <Switch value={isEnabled} onValueChange={setIsEnabled} />
 * ```
 */
export const Switch: React.FC<RNSwitchProps> = ({ value, ...props }) => {
  const {
    dark,
    colors: { primary, card },
  } = useTheme();

  return (
    <RNSwitch
      trackColor={{
        false: primary + (dark ? '70' : '30'),
        true: primary + (dark ? 'CC' : '70'),
      }}
      thumbColor={value ? primary : card}
      value={value}
      {...props}
      // ...your other switch props
      {...Platform.select({
        web: {
          activeThumbColor: primary,
        },
        android: {
          activeThumbColor: primary,
        },
      })}
    />
  );
};
