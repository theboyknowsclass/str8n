import { useEffect } from 'react';
import {
  Easing,
  SharedValue,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@react-navigation/native';

/**
 * Starting coordinates for the logo animation points.
 * These represent the initial positions of the four corner points.
 */
export const LogoStartPoints = [
  { x: 150, y: 150 },
  { x: 875, y: 200 },
  { x: 800, y: 750 },
  { x: 250, y: 875 },
];

/**
 * Ending coordinates for the logo animation points.
 * These represent the final positions of the four corner points.
 */
export const LogoEndPoints = [
  { x: 200, y: 200 },
  { x: 825, y: 200 },
  { x: 825, y: 825 },
  { x: 200, y: 825 },
];

/**
 * Base size of the logo in pixels.
 * Used for calculating scale factors.
 */
export const LogoSize = 1024;

/**
 * Hook that calculates the derived X coordinate for a logo point.
 *
 * This hook creates a derived value that interpolates between the start and end
 * X coordinates based on the animation progress and scale factor.
 *
 * @param index - The index of the point (0-3)
 * @param scale - The scale factor for the logo
 * @param animationProgress - Shared value controlling animation progress
 * @returns Derived value containing the calculated X coordinate
 *
 * @example
 * ```typescript
 * const x = useGetDerivedX(0, 0.5, animationProgress);
 * ```
 */
export const useGetDerivedX = (
  index: number,
  scale: number,
  animationProgress: SharedValue<number>
) => {
  return useDerivedValue(() => {
    const start = LogoStartPoints[index].x;
    const distance = LogoEndPoints[index].x - start;
    return (start + distance * animationProgress.value) * scale;
  });
};

/**
 * Hook that calculates the derived Y coordinate for a logo point.
 *
 * This hook creates a derived value that interpolates between the start and end
 * Y coordinates based on the animation progress and scale factor.
 *
 * @param index - The index of the point (0-3)
 * @param scale - The scale factor for the logo
 * @param animationProgress - Shared value controlling animation progress
 * @returns Derived value containing the calculated Y coordinate
 *
 * @example
 * ```typescript
 * const y = useGetDerivedY(0, 0.5, animationProgress);
 * ```
 */
export const useGetDerivedY = (
  index: number,
  scale: number,
  animationProgress: SharedValue<number>
) => {
  return useDerivedValue(() => {
    const start = LogoStartPoints[index].y;
    const distance = LogoEndPoints[index].y - start;
    return (start + distance * animationProgress.value) * scale;
  });
};

/**
 * Return type for the useLogo hook.
 * @property width - The width of the logo in pixels
 * @property height - The height of the logo in pixels
 * @property scale - The scale factor for the logo
 * @property animationProgress - Shared value controlling animation progress
 * @property strokeWidth - The width of the stroke in pixels
 * @property radius - The radius of the points in pixels
 * @property showText - Whether to show the logo text
 * @property foreground - The foreground color for the logo
 * @property background - The background color for the logo
 */
export type UseLogo = {
  width: number;
  height: number;
  scale: number;
  animationProgress: SharedValue<number>;
  strokeWidth: number;
  radius: number;
  showText: boolean;
  foreground: string;
  background: string;
};

/**
 * Hook that provides logo configuration and animation state.
 *
 * This hook manages the logo's appearance, animation, and theme integration.
 * It automatically starts a repeating animation and provides all necessary
 * styling and sizing information based on the logo variant.
 *
 * @param size - The desired size of the logo in pixels
 * @param variant - The variant of the logo ('icon' or 'logo')
 * @returns UseLogo object containing all logo configuration and animation state
 *
 * @example
 * ```typescript
 * const logoConfig = useLogo(100, 'logo');
 * ```
 */
export const useLogo = (size: number, variant: 'icon' | 'logo'): UseLogo => {
  const width = Math.max(size, 0);
  const height = Math.max(size, 0);

  const scale = size / LogoSize;

  const isLogo = variant === 'logo';
  const isIcon = variant === 'icon';

  const { colors, dark } = useTheme();

  const foreground = dark || isIcon ? colors.primary : colors.background;
  const background = dark || isIcon ? colors.background : colors.primary;

  const strokeWidth = isLogo ? 30 : 60;
  const radius = isLogo ? 80 : 120;
  const showText = isLogo;

  // Animation shared value
  const animationProgress = useSharedValue(0);

  // Start the animation
  useEffect(() => {
    animationProgress.value = withRepeat(
      withTiming(1, {
        duration: 2000,
        easing: Easing.inOut(Easing.cubic),
      }),
      -1, // Infinite repeat
      true // Reverse
    );
  }, [animationProgress]);

  return {
    strokeWidth,
    radius,
    showText,
    width,
    height,
    scale,
    animationProgress,
    foreground,
    background,
  };
};

/**
 * Props interface for logo point components.
 * @property index - The index of the point (0-3)
 * @property scale - The scale factor for the point
 * @property animationProgress - Shared value controlling animation progress
 * @property background - The background color of the point
 * @property foreground - The foreground/stroke color of the point
 */
export interface PointProps {
  index: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
}
