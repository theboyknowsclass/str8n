import Animated, {
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Circle } from 'react-native-svg';
import { useGetDerivedX, useGetDerivedY } from './useLogo';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PointProps {
  index: number;
  radius: number;
  strokeWidth: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
}

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
