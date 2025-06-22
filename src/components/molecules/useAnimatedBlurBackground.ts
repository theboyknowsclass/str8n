import { useCallback, useEffect, useState } from 'react';
import { runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';

interface UseAnimatedBlurBackgroundOptions {
  isVisible: boolean;
  fadeOutDelay?: number;
  opacityDuration?: number;
  targetOpacity?: number; // Allow custom opacity (e.g., 0.8 for Android)
}

interface UseAnimatedBlurBackgroundReturn {
  zIndex: number;
  opacity: ReturnType<typeof useSharedValue<number>>;
  setVisibility: () => void;
}

/**
 * Custom hook for managing AnimatedBlurBackground visibility with smooth animations
 *
 * Handles:
 * - Conditional rendering to prevent UX blocking
 * - Z-index management to prevent flickering
 * - Opacity animations for smooth transitions
 * - Timing coordination for show/hide sequences
 */
export const useAnimatedBlurBackground = ({
  isVisible,
  fadeOutDelay = 300,
  opacityDuration = 300,
  targetOpacity = 1, // Default to full opacity
}: UseAnimatedBlurBackgroundOptions): UseAnimatedBlurBackgroundReturn => {
  // Z-index management to control layering
  // 1000: Above all content (modal visible)
  // -1000: Below all content (modal hidden, allows interactions)
  const [zIndex, setZIndex] = useState(isVisible ? 1000 : -1000);

  // Animated opacity for smooth fade in/out
  const opacity = useSharedValue(isVisible ? targetOpacity : 0);

  /**
   * Manages the visibility state changes
   * Uses timing delays to prevent flickering and ensure smooth transitions
   */
  const setVisibility = useCallback(() => {
    if (isVisible) {
      // Show modal: render immediately, set high z-index
      setZIndex(1000);
    } else {
      // Hide modal: set low z-index first, then unmount after animation
      setTimeout(() => setZIndex(-1000), fadeOutDelay);
    }
  }, [isVisible, fadeOutDelay]);

  useEffect(() => {
    if (isVisible) {
      // Trigger visibility state changes
      runOnJS(setVisibility)();
    }

    // Animate opacity for smooth transitions
    const finalOpacity = isVisible ? targetOpacity : 0;
    opacity.value = withTiming(
      finalOpacity,
      {
        duration: opacityDuration,
      },
      (finished) => {
        // When hiding animation completes, trigger visibility cleanup
        if (finished && !isVisible) {
          runOnJS(setVisibility)();
        }
      }
    );
  }, [isVisible, opacity, setVisibility, opacityDuration, targetOpacity]);

  return {
    zIndex,
    opacity,
    setVisibility,
  };
};
