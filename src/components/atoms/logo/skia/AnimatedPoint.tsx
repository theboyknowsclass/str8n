import { Circle, Group } from '@shopify/react-native-skia';
import { PointProps, useGetDerivedX, useGetDerivedY } from '../useLogo';

export const AnimatedPoint = ({
  index,
  scale,
  animationProgress,
  background,
  foreground,
}: PointProps) => {
  const pointRadius = 80 * scale;
  const strokeWidth = 30 * scale;

  const x = useGetDerivedX(index, scale, animationProgress);
  const y = useGetDerivedY(index, scale, animationProgress);

  return (
    <Group>
      <Circle
        r={pointRadius}
        cx={x}
        cy={y}
        color={background}
        strokeWidth={strokeWidth}
        style={'stroke'}
      />
      <Circle
        r={pointRadius - strokeWidth / 2}
        cx={x}
        cy={y}
        color={foreground}
        style={'fill'}
      />
    </Group>
  );
};
