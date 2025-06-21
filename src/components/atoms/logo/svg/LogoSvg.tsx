import { StyleSheet, View } from 'react-native';
import Svg from 'react-native-svg';
import { useLogo } from '../useLogo';
import { useTheme } from '@react-navigation/native';
import { Path } from './Path';
import { Point } from './Point';

export type LogoSvgProps = {
  size: number;
};

export const LogoSvg: React.FC<LogoSvgProps> = ({ size }) => {
  const { width, height, scale, animationProgress } = useLogo(size);

  const { colors } = useTheme();

  const foreground = colors.primary;
  const background = colors.background;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg style={{ width, height }}>
        <Path
          scale={scale}
          animationProgress={animationProgress}
          background={background}
          foreground={foreground}
        />
        {[0, 1, 2, 3].map((index) => (
          <Point
            key={index}
            index={index}
            scale={scale}
            animationProgress={animationProgress}
            background={background}
            foreground={foreground}
          />
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
