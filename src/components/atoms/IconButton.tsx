import React from 'react';
import {
  TouchableOpacity,
  StyleSheet,
  TouchableOpacityProps,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { useTheme } from '@react-navigation/native';
import { IconType } from '@types';
import { Icon } from './Icon';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Props for the IconButton component.
 * @property icon - The icon to display in the button
 * @property loading - Whether the button is in a loading state (shows activity indicator)
 * @property disabled - Whether the button is disabled (reduces opacity and prevents interaction)
 * @property accessibilityLabel - The accessibility label for screen readers
 * @property title - Optional title to display alongside the icon
 * @property size - The size of the button ('small' or 'large')
 * @property showBorder - Whether to show the border around the button
 */
interface IconButtonProps extends TouchableOpacityProps {
  /** The icon to display */
  icon: IconType;
  /** Whether the button is in a loading state */
  loading?: boolean;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** The accessibility label for the button */
  accessibilityLabel: string;
  /** Optional title to display alongside the icon */
  title?: string;
  /** The size of the button */
  size?: 'small' | 'large';
  /** Whether to show the border around the button */
  showBorder?: boolean;
}

/**
 * IconButton component that provides a clean interface for icon-based buttons.
 *
 * This component creates a touchable button with an icon, supporting loading states,
 * theme integration, accessibility, and customizable styling. It automatically
 * handles disabled states and provides consistent visual feedback.
 *
 * Features:
 * - Support for icons with optional text
 * - Loading state with activity indicator
 * - Dark/light theme support
 * - Customizable styles
 * - Accessibility support
 * - Two size variants (small: 24px, large: 32px)
 * - Optional border styling
 *
 * @param props - IconButtonProps extending TouchableOpacityProps with icon-specific options
 * @returns JSX element containing the icon button
 *
 * @example
 * ```typescript
 * // Basic usage with border
 * <IconButton
 *   icon="settings"
 *   onPress={() => {}}
 *   accessibilityLabel="Settings"
 * />
 *
 * // Without border
 * <IconButton
 *   icon="settings"
 *   showBorder={false}
 *   onPress={() => {}}
 *   accessibilityLabel="Settings"
 * />
 *
 * // Small size with border
 * <IconButton
 *   icon="settings"
 *   size="small"
 *   onPress={() => {}}
 *   accessibilityLabel="Settings"
 * />
 * ```
 */
export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  loading = false,
  disabled,
  accessibilityLabel,
  title,
  size = 'large',
  showBorder = true,
  style,
  ...rest
}) => {
  const { colors } = useTheme();
  const iconSize = size === 'small' ? 20 : 36;

  const getButtonStyles = (): ViewStyle => {
    return {
      opacity: disabled ? 0.5 : 1,
      borderWidth: showBorder ? 2 : 0,
      borderColor: colors.primary,
    };
  };

  return (
    <TouchableOpacity
      style={[styles.button, styles[size], getButtonStyles(), style]}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      {...rest}
    >
      {loading ? (
        <LoadingSpinner size={iconSize} animating={loading} />
      ) : (
        <Icon name={icon} size={iconSize} />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 9999,
    alignSelf: 'flex-start',
  },
  small: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  large: {
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
});
