import { useTheme } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { useEffect, useMemo } from 'react';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useAnimatedBlurBackground } from '@molecules';

interface AnimatedBlurBackgroundProps {
  children: React.ReactNode;
  isVisible: boolean;
}

/**
 * AnimatedBlurBackground - Modal overlay for Android
 *
 * Android-specific implementation that:
 * 1. Uses a solid background color instead of blur (better performance)
 * 2. Animates smoothly in/out without flickering
 * 3. Doesn't block interactions when hidden
 * 4. Uses conditional rendering to prevent UX blocking
 *
 * Note: Android doesn't support BlurView as well as iOS, so we use
 * a solid background with opacity animation instead.
 */
export const AnimatedBlurBackground: React.FC<AnimatedBlurBackgroundProps> = ({
  children,
  isVisible,
}) => {
  const {
    colors: { background },
  } = useTheme();

  // Use the shared AnimatedBlurBackground hook
  const { shouldRender, zIndex, opacity } = useAnimatedBlurBackground({
    isVisible,
    fadeOutDelay: 300,
    opacityDuration: 300,
    targetOpacity: 0.8, // Android uses 80% opacity for semi-transparent overlay
  });

  // Animate the opacity style for the entire overlay
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  // Memoized style combining background color and z-index
  const themedStyle = useMemo(() => {
    return {
      backgroundColor: background,
      zIndex: zIndex,
    };
  }, [background, zIndex]);

  // Don't render anything when hidden to prevent blocking interactions
  if (!shouldRender) {
    return null;
  }

  return (
    <Animated.View style={[styles.blurContainer, themedStyle, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
