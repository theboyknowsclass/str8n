import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTheme } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Circle, Svg } from 'react-native-svg';

/**
 * Props for the SpinnerDot component.
 * @property size - The size of the spinner in pixels
 * @property animating - Whether the spinner should animate
 */
interface LoadingSpinnerProps {
  size: number;
  animating: boolean;
}

const REF_SIZE = 1000;

/**
 * SpinnerDot component that renders a circular loading spinner with rotating segment.
 *
 * This component creates a circular outline with a colored segment that rotates
 * around the circle when animating. It uses React Native SVG and Reanimated for
 * smooth rotation animations.
 *
 * @param props - SpinnerDotProps containing size and animation state
 * @returns JSX element containing the animated spinner
 *
 * @example
 * ```typescript
 * <SpinnerDot size={40} animating={true} />
 * ```
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size,
  animating,
}) => {
  const { colors } = useTheme();
  const rotation = useSharedValue(0);

  const scale = size / REF_SIZE;

  useEffect(() => {
    if (animating) {
      // Rotate continuously when animating
      rotation.value = withRepeat(
        withTiming(360, {
          duration: 1000 + 2000 * scale,
          easing: Easing.linear,
        }),
        -1 // Infinite repeat
      );
    } else {
      // Stop rotation when not animating
      rotation.value = withTiming(0, { duration: 200 });
    }
  }, [animating, rotation, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }],
    };
  });

  const center = size / 2;
  const strokeWidth = 100 * scale;
  const radius = (size - strokeWidth) / 2; // Leave some padding for stroke width

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        {/* Background circle outline */}
        <Circle
          cx={center}
          cy={center}
          r={radius}
          stroke={colors.border || '#E0E0E0'}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
      </Svg>

      {/* Rotating colored segment */}
      <Animated.View style={[{ width: size, height: size }, animatedStyle]}>
        <Svg width={size} height={size}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.primary}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={`${radius * Math.PI * 0.1} ${radius * Math.PI * 1.9}`}
            strokeDashoffset={0}
            strokeLinecap="round"
            transform={`rotate(-90 ${center} ${center})`}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
