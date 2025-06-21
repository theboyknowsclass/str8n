import Animated, {
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Circle } from 'react-native-svg';
import { useGetDerivedX, useGetDerivedY } from '../useLogo';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface PointProps {
  index: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
}

export const Point = ({
  index,
  scale,
  animationProgress,
  background,
  foreground,
}: PointProps) => {
  const pointRadius = 120 * scale;
  const strokeWidth = 60 * scale;

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
      r={pointRadius}
      stroke={foreground}
      fill={background}
      strokeWidth={strokeWidth}
    />
  );
};
