import Animated, {
  SharedValue,
  useAnimatedProps,
} from 'react-native-reanimated';
import { Polygon } from 'react-native-svg';
import { useGetDerivedX, useGetDerivedY } from '../useLogo';

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

type PathProps = {
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
};

export const Path = ({
  scale,
  animationProgress,
  background,
  foreground,
}: PathProps) => {
  const strokeWidth = 60 * scale;
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
      strokeWidth={strokeWidth}
    />
  );
};
