import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, {
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Platform, StyleSheet } from 'react-native';
import { useEffect, } from 'react';
import { useAnimatedBlurBackground } from './useAnimatedBlurBackground';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AnimatedBlurBackgroundProps {
  children: React.ReactNode;
  isVisible: boolean;
}

/**
 * AnimatedBlurBackground - Modal overlay with blur effect
 *
 * This component creates a modal overlay that:
 * 1. Shows a blurred background when visible
 * 2. Animates smoothly in/out without flickering
 * 3. Doesn't block interactions when hidden
 * 4. Uses conditional rendering to prevent UX blocking
 */
export const AnimatedBlurBackground: React.FC<AnimatedBlurBackgroundProps> = ({
  children,
  isVisible,
}) => {
  const { dark } = useTheme();
  const blurTint = dark ? 'default' : 'regular';

  // Use the shared AnimatedBlurBackground hook
  const { zIndex, opacity, pointerEvents } = useAnimatedBlurBackground({
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
      intensity={blurIntensity.value}
      tint={blurTint}
      style={[styles.blurContainer, styles.blurView, { zIndex : 1000 }]}
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
  blurContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  opacityContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
