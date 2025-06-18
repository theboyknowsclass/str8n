import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  Platform,
  Switch as RNSwitch,
  SwitchProps as RNSwitchProps,
} from 'react-native';

/**
 * A themed Switch component that uses the current theme colors
 */
export const Switch: React.FC<RNSwitchProps> = ({ value, ...props }) => {
  const {
    dark,
    colors: { primary },
  } = useTheme();

  return (
    <RNSwitch
      trackColor={{
        false: primary + (dark ? '70' : '30'),
        true: primary + (dark ? 'CC' : '70'),
      }}
      // thumbColor={value ? primary : primary}
      value={value}
      {...props}
      // ...your other switch props
      {...Platform.select({
        web: {
          activeThumbColor: primary,
        },
      })}
    />
  );
};
