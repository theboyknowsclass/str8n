import { useTheme } from '@react-navigation/native';
import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp,
} from 'react-native';
import { Text } from './Text';

interface TextButtonProps extends TouchableOpacityProps {
  /** The text to display on the button */
  title: string;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** The visual style variant of the button */
  variant?: 'primary' | 'secondary' | 'outline';
  /** The size of the button */
  size?: 'small' | 'medium' | 'large' | 'larger';
  /** The size of the text */
  textStyle?: StyleProp<TextStyle>;
  /** Whether the button is disabled */
  disabled?: boolean;
}

/**
 * A button component that provides consistent styling and theming across the app.
 * Features a custom Text component for consistent typography and automatic color handling.
 *
 * Features:
 * - Multiple visual variants (primary, secondary, outline)
 * - Three size options (small, medium, large)
 * - Loading state with activity indicator
 * - Responsive sizing based on screen width
 * - Automatic text color handling based on variant and theme
 * - Customizable styles for both container and text
 * - Accessibility support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <TextButton title="Click me" onPress={() => {}} />
 *
 * // With loading state
 * <TextButton title="Loading..." loading />
 *
 * // With custom styles and outline variant
 * <TextButton
 *   title="Custom"
 *   style={{ marginTop: 20 }}
 *   variant="outline"
 * />
 * ```
 */
export const TextButton: React.FC<TextButtonProps> = ({
  title,
  loading = false,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  textStyle,
  style,
  ...rest
}) => {
  const { colors, dark: isDarkTheme } = useTheme();

  const getButtonStyles = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      backgroundColor: colors.primary,
      borderRadius: 2,
      opacity: disabled ? 0.5 : 1,
      alignSelf: 'center',
    };

    const sizeStyles: Record<string, ViewStyle> = {
      small: { paddingVertical: 6, paddingHorizontal: 12 },
      medium: { paddingVertical: 10, paddingHorizontal: 16 },
      large: { paddingVertical: 14, paddingHorizontal: 24 },
    };

    const variantStyles: Record<string, ViewStyle> = {
      primary: { backgroundColor: colors.primary },
      secondary: { backgroundColor: isDarkTheme ? '#2C2C2C' : '#E0E0E0' },
      outline: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: colors.primary,
      },
    };

    return {
      ...baseStyle,
      ...sizeStyles[size],
      ...variantStyles[variant],
      ...(style as ViewStyle),
    };
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary':
        return colors.text;
      case 'secondary':
        return colors.text;
      case 'outline':
        return colors.primary;
      default:
        return colors.text;
    }
  };

  return (
    <TouchableOpacity
      style={[styles.button, getButtonStyles()]}
      disabled={disabled || loading}
      accessibilityRole="button"
      {...rest}
    >
      {loading ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <Text color={getTextColor()} size={size} style={textStyle}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export type CircleTextButtonProps = TextButtonProps & {
  fontSize?: number;
};

export const CircleTextButton: React.FC<CircleTextButtonProps> = ({
  title,
  loading = false,
  disabled = false,
  fontSize = 32,
  ...rest
}) => {
  const textStyle = {
    fontSize: fontSize,
  };

  return (
    <TextButton
      title={title}
      loading={loading}
      disabled={disabled}
      variant="outline"
      style={styles.roundButton}
      size="medium"
      textStyle={[textStyle, styles.text]}
      {...rest}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    minWidth: 50,
  },
  roundButton: {
    width: 56,
    height: 56,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 2,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontFamily: 'Orbitron_700Bold',
  },
});
