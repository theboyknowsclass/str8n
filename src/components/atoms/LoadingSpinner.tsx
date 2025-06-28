import { useTheme } from '@react-navigation/native';
import React from 'react';
import { ActivityIndicator, ActivityIndicatorProps } from 'react-native';

/**
 * Props for the LoadingSpinner component.
 * @property size - Optional size of the spinner in pixels (defaults to 40)
 * @property animating - Whether the spinner is animating (defaults to true)
 */
interface LoadingSpinnerProps extends Omit<ActivityIndicatorProps, 'size'> {
  size?: number;
  animating?: boolean;
}

/**
 * LoadingSpinner component that provides a themed loading indicator.
 *
 * This component wraps React Native's ActivityIndicator with theme integration
 * and consistent styling. It uses the primary theme color with reduced opacity
 * for a subtle appearance and provides customizable size and animation control.
 *
 * @param props - LoadingSpinnerProps extending ActivityIndicatorProps with custom options
 * @returns JSX element containing the themed loading spinner
 *
 * @example
 * ```typescript
 * <LoadingSpinner size={60} />
 * <LoadingSpinner animating={false} />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  animating = true,
  ...props
}) => {
  const { colors } = useTheme();

  return (
    <ActivityIndicator
      size={size}
      animating={animating}
      hidesWhenStopped={false}
      color={`${colors.primary}90`}
      {...props}
    />
  );
};
