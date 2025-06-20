import { useTheme } from '@react-navigation/native';
import {
  Canvas,
  Circle,
  Group,
  Path,
  Skia,
  Text,
  useFont,
} from '@shopify/react-native-skia';
import Animated, {
  useDerivedValue,
  withRepeat,
  withTiming,
  useSharedValue,
  SharedValue,
  Easing,
} from 'react-native-reanimated';
import { useEffect } from 'react';

interface LogoProps {
  size: number;
  fontSize?: number;
}

const points = [
  { x: 150, y: 150 },
  { x: 875, y: 200 },
  { x: 800, y: 750 },
  { x: 250, y: 875 },
];

const targetPoints = [
  { x: 200, y: 200 },
  { x: 825, y: 200 },
  { x: 825, y: 825 },
  { x: 200, y: 825 },
];

export const useGetDerivedX = (
  index: number,
  scale: number,
  animationProgress: SharedValue<number>
) => {
  return useDerivedValue(() => {
    const start = points[index].x;
    const distance = targetPoints[index].x - start;
    return (start + distance * animationProgress.value) * scale;
  });
};

export const useGetDerivedY = (
  index: number,
  scale: number,
  animationProgress: SharedValue<number>
) => {
  return useDerivedValue(() => {
    const start = points[index].y;
    const distance = targetPoints[index].y - start;
    return (start + distance * animationProgress.value) * scale;
  });
};

interface PointProps {
  index: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
}

const Point = ({
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

export const Logo: React.FC<LogoProps> = ({ size }) => {
  const { dark, colors } = useTheme();

  const foreground = dark ? colors.background : colors.primary;
  const background = dark ? colors.primary : colors.background;

  const fontPosition = { x: 250, y: 525 };
  const fontSize = 130;

  const width = Math.max(size, 0);
  const height = Math.max(size, 0);

  const scale = size / 1024;

  const strokeWidth = 30 * scale;

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

  const pathStyle = dark ? 'stroke' : 'fill';
  const pathColor = dark ? background : foreground;

  const font = useFont(
    require('../../assets/Orbitron_500Medium.ttf'),
    fontSize * scale
  );

  return (
    <Animated.View>
      <Canvas
        style={{
          width: width,
          height: height,
          borderWidth: 0,
        }}
      >
        <Path
          path={animatedPath}
          color={pathColor}
          style={pathStyle}
          strokeWidth={strokeWidth}
        />
        {points.map((point, index) => (
          <Point
            key={index}
            index={index}
            scale={scale}
            animationProgress={animationProgress}
            background={background}
            foreground={foreground}
          />
        ))}
        <Text
          x={fontPosition.x * scale}
          y={fontPosition.y * scale}
          text="STR8N"
          font={font}
          color={background}
        />
      </Canvas>
    </Animated.View>
  );
};
