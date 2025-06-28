import Animated, {
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Polygon } from 'react-native-svg';
import { useGetDerivedX, useGetDerivedY } from './useLogo';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

/**
 * Props for the Path component.
 * @property strokeWidth - The width of the stroke in pixels
 * @property scale - The scale factor for the path
 * @property animationProgress - Shared value controlling animation progress
 * @property background - The background color of the path
 * @property foreground - The foreground/stroke color of the path
 */
type PathProps = {
  strokeWidth: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
};

/**
 * Path component that renders an animated polygon for the logo.
 *
 * This component creates an animated polygon that forms part of the STR8N logo.
 * It uses React Native Reanimated to smoothly animate the polygon points based
 * on the animation progress, creating a dynamic visual effect.
 *
 * @param props - PathProps containing styling and animation parameters
 * @returns JSX element containing the animated polygon
 *
 * @example
 * ```typescript
 * <Path
 *   strokeWidth={2}
 *   scale={1.0}
 *   animationProgress={progress}
 *   background="#000000"
 *   foreground="#FFFFFF"
 * />
 * ```
 */
export const Path = ({
  strokeWidth,
  scale,
  animationProgress,
  background,
  foreground,
}: PathProps) => {
  const scaledStrokeWidth = strokeWidth * scale;
  const x1 = useGetDerivedX(0, scale, animationProgress);
  const y1 = useGetDerivedY(0, scale, animationProgress);
  const x2 = useGetDerivedX(1, scale, animationProgress);
  const y2 = useGetDerivedY(1, scale, animationProgress);
  const x3 = useGetDerivedX(2, scale, animationProgress);
  const y3 = useGetDerivedY(2, scale, animationProgress);
  const x4 = useGetDerivedX(3, scale, animationProgress);
  const y4 = useGetDerivedY(3, scale, animationProgress);

  const animatedProps = useAnimatedProps(() => {
    return {
      points: `${x1.value},${y1.value} ${x2.value},${y2.value} ${x3.value},${y3.value} ${x4.value},${y4.value}`,
    };
  }, [x1, y1, x2, y2, x3, y3, x4, y4]);

  return (
    <AnimatedPolygon
      animatedProps={animatedProps}
      fill={background}
      stroke={foreground}
      strokeWidth={scaledStrokeWidth}
    />
  );
};
