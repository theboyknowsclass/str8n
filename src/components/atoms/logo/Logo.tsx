import { StyleSheet, View } from 'react-native';
import { Svg, Text } from 'react-native-svg';
import { useLogo } from './useLogo';
import { Path } from './Path';
import { Point } from './Point';

/**
 * Props for the Logo component.
 * @property size - The size of the logo in pixels
 * @property variant - The variant of the logo ('icon' or 'logo')
 */
export type LogoProps = {
  size: number;
  variant: 'icon' | 'logo';
};

/**
 * Logo component that renders the STR8N logo with animated elements.
 *
 * This component creates an animated SVG logo with customizable size and variant.
 * It includes animated path elements, points, and optional text. The logo uses
 * the Orbitron font family and supports both icon and full logo variants.
 *
 * @param props - LogoProps containing size and variant options
 * @returns JSX element containing the animated logo
 *
 * @example
 * ```typescript
 * <Logo size={100} variant="logo" />
 * <Logo size={32} variant="icon" />
 * ```
 */
export const Logo: React.FC<LogoProps> = ({ size, variant = 'icon' }) => {
  const {
    width,
    height,
    scale,
    animationProgress,
    strokeWidth,
    radius,
    showText,
    foreground,
    background,
  } = useLogo(size, variant);

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg style={{ width, height }}>
        <Path
          strokeWidth={strokeWidth}
          scale={scale}
          animationProgress={animationProgress}
          background={background}
          foreground={foreground}
        />
        {[0, 1, 2, 3].map((index) => (
          <Point
            key={index}
            index={index}
            radius={radius}
            strokeWidth={strokeWidth}
            scale={scale}
            animationProgress={animationProgress}
            background={background}
            foreground={foreground}
          />
        ))}
        {showText && (
          <Text
            fontFamily="Orbitron_500Medium"
            fontSize={130 * scale}
            fill={foreground}
            x={245 * scale}
            y={550 * scale}
          >
            STR8N
          </Text>
        )}
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
