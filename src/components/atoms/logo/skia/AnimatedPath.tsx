import { Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, SharedValue } from 'react-native-reanimated';
import { LogoStartPoints, LogoEndPoints } from '../useLogo';

interface AnimatedPathProps {
  scale: number;
  animationProgress: SharedValue<number>;
  foreground: string;
  background: string;
  dark: boolean;
}

export const AnimatedPath = ({
  scale,
  animationProgress,
  foreground,
  background,
  dark,
}: AnimatedPathProps) => {
  const pathStyle = dark ? 'stroke' : 'fill';
  const pathColor = dark ? background : foreground;
  const strokeWidth = 30 * scale;

  // Animated path using direct interpolation
  const animatedPath = useDerivedValue(() => {
    const path = Skia.Path.Make();

    // Interpolate between original and target points
    const currentPoints = LogoStartPoints.map((point, index) => {
      const target = LogoEndPoints[index];
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
      color={pathColor}
      style={pathStyle}
      strokeWidth={strokeWidth}
    />
  );
};
