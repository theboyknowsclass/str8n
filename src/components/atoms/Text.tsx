import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  Text as RNText,
  TextProps as RNTextProps,
  StyleSheet,
} from 'react-native';

interface TextProps extends RNTextProps {
  /** The color of the text */
  color?: string;
  /** The size of the text */
  size?: 'small' | 'medium' | 'large' | 'larger';
}

/**
 * A themed text component that provides consistent styling across the app.
 * Extends React Native's Text component with additional styling capabilities.
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
