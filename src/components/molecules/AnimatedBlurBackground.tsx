import { useTheme } from 'expo-router/react-navigation';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Platform, StyleSheet } from 'react-native';
import { useEffect } from 'react';
import { useAnimatedBlurBackground } from './useAnimatedBlurBackground';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

/**
 * Props for the AnimatedBlurBackground component.
 * @property children - React nodes to render inside the blur background
 * @property isVisible - Boolean controlling the visibility and animation state
 */
interface AnimatedBlurBackgroundProps {
  children: React.ReactNode;
  isVisible: boolean;
}

/**
 * AnimatedBlurBackground component that creates a modal overlay with blur effect.
 *
 * This component creates a modal overlay that provides a blurred background effect
 * with smooth animations. It uses React Native Reanimated for performant animations
 * and Expo Blur for the blur effect, automatically adapting to theme changes.
 *
 * Features:
 * - Smooth blur intensity animations
 * - Theme-aware blur tint
 * - Non-blocking when hidden
 * - Platform-specific optimizations
 *
 * @param props - AnimatedBlurBackgroundProps containing children and visibility state
 * @returns JSX element containing the animated blur background
 *
 * @example
 * ```typescript
 * <AnimatedBlurBackground isVisible={showModal}>
 *   <ModalContent />
 * </AnimatedBlurBackground>
 * ```
 */
export const AnimatedBlurBackground: React.FC<AnimatedBlurBackgroundProps> = ({
  children,
  isVisible,
}) => {
  const { dark } = useTheme();
  const blurTint = dark ? 'default' : 'regular';

  // Use the shared AnimatedBlurBackground hook
  const { opacity, pointerEvents } = useAnimatedBlurBackground({
    isVisible,
  });

  // Animated blur intensity for the BlurView
  const blurIntensity = useSharedValue(isVisible ? 70 : 0);

  // Animate the blur intensity prop for the BlurView
  const animatedProps = useAnimatedProps(() => {
    return {
      intensity: blurIntensity.value,
    };
  });

  // Animate the opacity style for the content container
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    // Animation timing configuration for blur
    const targetIntensity = isVisible ? 70 : 0;
    const easing = isVisible ? Easing.in(Easing.quad) : Easing.out(Easing.quad);

    // Animate blur intensity (slower for smooth effect)
    blurIntensity.value = withTiming(targetIntensity, {
      duration: 500,
      easing,
    });
  }, [isVisible, blurIntensity]);

  // // Don't render anything when hidden to prevent blocking interactions
  // if (!shouldRender) {
  //   return null;
  // }

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      tint={blurTint}
      style={styles.blurView}
      pointerEvents={pointerEvents}
      {...Platform.select({
        android: {
          experimentalBlurMethod: 'dimezisBlurView',
        },
      })}
    >
      {/* Content container with animated opacity */}
      <Animated.View style={[styles.opacityContainer, animatedStyle]}>
        {children}
      </Animated.View>
    </AnimatedBlurView>
  );
};

const styles = StyleSheet.create({
  blurView: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  opacityContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
