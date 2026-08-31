import { useTheme } from 'expo-router/react-navigation';
import React from 'react';
import {
  ColorValue,
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';

/**
 * Props for the Text component.
 * @property color - Optional custom color for the text (defaults to theme text color)
 * @property size - Text size variant ('small', 'medium', 'large', 'larger')
 */
interface TextProps extends RNTextProps {
  /** The color of the text */
  color?: ColorValue;
  /** The size of the text */
  size?: 'small' | 'medium' | 'large' | 'larger';
}

/**
 * Text component that provides consistent themed styling across the app.
 *
 * This component extends React Native's Text component with additional
 * styling capabilities including theme integration, size variants, and
 * custom color support. It uses the Orbitron font family for consistent
 * typography throughout the application.
 *
 * @param props - TextProps extending React Native TextProps with additional styling options
 * @returns JSX element containing the styled text
 *
 * @example
 * ```typescript
 * <Text size="large" color="#FF0000">Hello World</Text>
 * ```
 */
export const Text: React.FC<TextProps> = ({
  color,
  size = 'medium',
  style,
  ...rest
}) => {
  const { colors } = useTheme();

  const getTextStyles = () => {
    const baseStyle = {
      fontFamily: 'Orbitron_400Regular',
      color: color || colors.text,
    };

    const sizeStyles = {
      small: { fontSize: 12 },
      medium: { fontSize: 16 },
      large: { fontSize: 18 },
      larger: { fontSize: 24 },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
    };
  };

  return <RNText style={[styles.text, getTextStyles(), style]} {...rest} />;
};

const styles = StyleSheet.create({
  text: {
    textAlign: 'center',
  },
});
