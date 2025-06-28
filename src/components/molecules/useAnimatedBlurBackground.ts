import { useCallback, useEffect, useRef, useState } from 'react';
import {
  runOnJS,
  SharedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Options for the useAnimatedBlurBackground hook.
 * @property isVisible - Boolean controlling the visibility state
 * @property fadeOutDelay - Optional delay before hiding the background (defaults to 500ms)
 * @property opacityDuration - Optional duration for opacity animations (defaults to 500ms)
 * @property targetOpacity - Optional target opacity value (defaults to 1)
 */
interface UseAnimatedBlurBackgroundOptions {
  isVisible: boolean;
  fadeOutDelay?: number;
  opacityDuration?: number;
  targetOpacity?: number; // Allow custom opacity (e.g., 0.8 for Android)
}

/**
 * Return type for the useAnimatedBlurBackground hook.
 * @property zIndex - The z-index value for layering control
 * @property pointerEvents - The pointer events setting ('auto' or 'none')
 * @property opacity - Shared value for animated opacity
 */
interface UseAnimatedBlurBackgroundReturn {
  zIndex: number;
  pointerEvents: 'auto' | 'none';
  opacity: SharedValue<number>;
}

const DEFAULT_FADE_OUT_DELAY = 500;
const DEFAULT_OPACITY_DURATION = 500;

/**
 * Hook for managing AnimatedBlurBackground visibility with smooth animations.
 *
 * This hook provides state management for blur background animations, handling
 * conditional rendering, z-index management, and timing coordination to prevent
 * flickering and ensure smooth transitions between visible and hidden states.
 *
 * Features:
 * - Conditional rendering to prevent UX blocking
 * - Z-index management to prevent flickering
 * - Opacity animations for smooth transitions
 * - Timing coordination for show/hide sequences
 *
 * @param options - UseAnimatedBlurBackgroundOptions containing visibility and timing settings
 * @returns UseAnimatedBlurBackgroundReturn object containing animation state and controls
 *
 * @example
 * ```typescript
 * const { opacity, pointerEvents } = useAnimatedBlurBackground({
 *   isVisible: showModal,
 *   fadeOutDelay: 300,
 *   opacityDuration: 400
 * });
 * ```
 */
export const useAnimatedBlurBackground = ({
  isVisible,
  fadeOutDelay = DEFAULT_FADE_OUT_DELAY,
  opacityDuration = DEFAULT_OPACITY_DURATION,
  targetOpacity = 1, // Default to full opacity
}: UseAnimatedBlurBackgroundOptions): UseAnimatedBlurBackgroundReturn => {
  // Z-index management to control layering
  // 1000: Above all content (modal visible)
  // -1000: Below all content (modal hidden, allows interactions)
  const [zIndex, setZIndex] = useState(isVisible ? 1000 : -1000);

  // Animated opacity for smooth fade in/out
  const opacity = useSharedValue(isVisible ? targetOpacity : 0);

  // Timeout reference for fade out delay
  const timeoutRef = useRef<
    NodeJS.Timeout | string | number | undefined | null
  >(null);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  /**
   * Manages the visibility state changes
   * Uses timing delays to prevent flickering and ensure smooth transitions
   */
  const setVisibility = useCallback(
    (skipDelay: boolean) => {
      if (isVisible) {
        // Show modal: render immediately, set high z-index
        setZIndex(1000);
      } else {
        // Hide modal: set low z-index first, then unmount after animation
        if (skipDelay) {
          setZIndex(-1000);
        } else {
          timeoutRef.current = setTimeout(() => setZIndex(-1000), fadeOutDelay);
        }
      }
    },
    [isVisible, fadeOutDelay]
  );

  useEffect(() => {
    if (isVisible) {
      // Trigger visibility state changes
      runOnJS(setVisibility)(false);
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
          runOnJS(setVisibility)(true);
        }
      }
    );
  }, [isVisible, opacity, setVisibility, opacityDuration, targetOpacity]);

  return {
    zIndex,
    opacity,
    pointerEvents: isVisible ? 'auto' : 'none',
  };
};
