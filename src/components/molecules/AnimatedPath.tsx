import { Path, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';
import { Point } from '@types';

interface AnimatedPathProps {
  points: Point[];
  targetPoints: Point[];
  scale: number;
  color: string;
  style: 'stroke' | 'fill';
  strokeWidth: number;
  duration?: number;
}

export const AnimatedPath: React.FC<AnimatedPathProps> = ({
  points,
  targetPoints,
  scale,
  color,
  style,
  strokeWidth,
  duration = 2000,
}) => {
  // Animation shared value
  const animationProgress = useSharedValue(0);

  // Start the animation
  useEffect(() => {
    animationProgress.value = withRepeat(
      withTiming(1, { duration }),
      -1, // Infinite repeat
      true // Reverse
    );
  }, [duration, animationProgress]);

  // Animated path using direct interpolation
  const animatedPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    // Interpolate between original and target points
    const currentPoints = points.map((point, index) => {
      const target = targetPoints[index];
      return {
        x: (point.x + (target.x - point.x) * animationProgress.value) * scale,
        y: (point.y + (target.y - point.y) * animationProgress.value) * scale,
      };
    });

    path.moveTo(currentPoints[0].x, currentPoints[0].y);
    path.lineTo(currentPoints[1].x, currentPoints[1].y);
    path.lineTo(currentPoints[2].x, currentPoints[2].y);
    path.lineTo(currentPoints[3].x, currentPoints[3].y);
    path.close();
    return path;
  }, [animationProgress, scale]);

  return (
    <Path
      path={animatedPath}
      color={color}
      style={style}
      strokeWidth={strokeWidth}
    />
  );
};
