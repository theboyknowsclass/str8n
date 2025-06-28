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

export const LogoStartPoints = [
  { x: 150, y: 150 },
  { x: 875, y: 200 },
  { x: 800, y: 750 },
  { x: 250, y: 875 },
];

export const LogoEndPoints = [
  { x: 200, y: 200 },
  { x: 825, y: 200 },
  { x: 825, y: 825 },
  { x: 200, y: 825 },
];

export const LogoSize = 1024;

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

export interface PointProps {
  index: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
}
