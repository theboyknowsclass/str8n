import { useTheme } from '@react-navigation/native';
import { Canvas } from '@shopify/react-native-skia';
import Animated from 'react-native-reanimated';
import { LogoStartPoints, useLogo } from '../useLogo';
import { AnimatedPoint } from './AnimatedPoint';
import { AnimatedPath } from './AnimatedPath';
import { LogoText } from './LogoText';

interface LogoProps {
  size: number;
  fontSize?: number;
}

export const Logo: React.FC<LogoProps> = ({ size }) => {
  const { width, height, scale, animationProgress } = useLogo(size);

  const { dark, colors } = useTheme();

  const foreground = dark ? colors.background : colors.primary;
  const background = dark ? colors.primary : colors.background;

  return (
    <Animated.View>
      <Canvas
        style={{
          width: width,
          height: height,
          borderWidth: 0,
        }}
      >
        <AnimatedPath
          scale={scale}
          animationProgress={animationProgress}
          foreground={foreground}
          background={background}
          dark={dark}
        />
        {LogoStartPoints.map((_, index) => (
          <AnimatedPoint
            key={index}
            index={index}
            scale={scale}
            animationProgress={animationProgress}
            background={background}
            foreground={foreground}
          />
        ))}
        <LogoText scale={scale} background={background} />
      </Canvas>
    </Animated.View>
  );
};
