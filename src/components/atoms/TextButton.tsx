import { useTheme } from 'expo-router/react-navigation';
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

/**
 * Props for the TextButton component.
 * @property title - The text to display on the button
 * @property loading - Whether the button is in a loading state (shows activity indicator)
 * @property variant - The visual style variant of the button ('primary', 'secondary', 'outline')
 * @property size - The size of the button ('small', 'medium', 'large', 'larger')
 * @property textStyle - Optional custom styles for the text
 * @property disabled - Whether the button is disabled (reduces opacity and prevents interaction)
 */
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
 * TextButton component that provides consistent styling and theming across the app.
 *
 * This component creates a touchable button with text, supporting multiple visual
 * variants, sizes, loading states, and theme integration. It uses the custom Text
 * component for consistent typography and automatically handles colors based on
 * the selected variant and current theme.
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
 * @param props - TextButtonProps extending TouchableOpacityProps with button-specific options
 * @returns JSX element containing the styled text button
 *
 * @example
 * ```typescript
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

  // Theme colors in this app are always plain hex strings, never
  // PlatformColor/DynamicColorIOS, so ColorValue narrows safely to string.
  const getTextColor = (): string => {
    switch (variant) {
      case 'primary':
        return colors.text as string;
      case 'secondary':
        return colors.text as string;
      case 'outline':
        return colors.primary as string;
      default:
        return colors.text as string;
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

/**
 * Props for the CircleTextButton component.
 * @property fontSize - Optional custom font size for the button text
 */
export type CircleTextButtonProps = TextButtonProps & {
  fontSize?: number;
};

/**
 * CircleTextButton component that renders a circular button with text.
 *
 * This component creates a circular button using the TextButton component
 * with outline variant and circular styling. It's commonly used for
 * action buttons that need to stand out visually.
 *
 * @param props - CircleTextButtonProps extending TextButtonProps with font size option
 * @returns JSX element containing the circular text button
 *
 * @example
 * ```typescript
 * <CircleTextButton title="?" fontSize={24} onPress={handleHelp} />
 * ```
 */
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
