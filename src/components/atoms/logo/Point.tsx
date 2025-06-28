import Animated, {
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Circle } from 'react-native-svg';
import { useGetDerivedX, useGetDerivedY } from './useLogo';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/**
 * Props for the Point component.
 * @property index - The index of the point (0-3)
 * @property radius - The radius of the point in pixels
 * @property strokeWidth - The width of the stroke in pixels
 * @property scale - The scale factor for the point
 * @property animationProgress - Shared value controlling animation progress
 * @property background - The background color of the point
 * @property foreground - The foreground/stroke color of the point
 */
interface PointProps {
  index: number;
  radius: number;
  strokeWidth: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
}

/**
 * Point component that renders an animated circle for the logo.
 *
 * This component creates an animated circle that represents a point in the STR8N logo.
 * It uses React Native Reanimated to smoothly animate the circle position based on
 * the animation progress and point index, creating a dynamic visual effect.
 *
 * @param props - PointProps containing styling and animation parameters
 * @returns JSX element containing the animated circle
 *
 * @example
 * ```typescript
 * <Point
 *   index={0}
 *   radius={5}
 *   strokeWidth={2}
 *   scale={1.0}
 *   animationProgress={progress}
 *   background="#000000"
 *   foreground="#FFFFFF"
 * />
 * ```
 */
export const Point = ({
  index,
  radius,
  strokeWidth,
  scale,
  animationProgress,
  background,
  foreground,
}: PointProps) => {
  const scaledRadius = radius * scale;
  const scaledStrokeWidth = strokeWidth * scale;

  const x = useGetDerivedX(index, scale, animationProgress);
  const y = useGetDerivedY(index, scale, animationProgress);

  const animatedProps = useAnimatedProps(() => {
    return {
      cx: x.value,
      cy: y.value,
    };
  }, [x, y]);

  return (
    <AnimatedCircle
      animatedProps={animatedProps}
      r={scaledRadius}
      stroke={foreground}
      fill={background}
      strokeWidth={scaledStrokeWidth}
    />
  );
};
