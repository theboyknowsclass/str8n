import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from 'react-native-reanimated';

/**
 * Props for the LoadingContainer component.
 * @property children - React nodes to be rendered when ready
 * @property isReady - Boolean indicating if content should be visible
 */
interface LoadingContainerProps {
  children: React.ReactNode;
  isReady: boolean;
}

/**
 * LoadingContainer component that provides smooth content transitions.
 *
 * This component wraps content with fade in/out animations based on the ready state.
 * It provides a smooth transition when content becomes available, improving
 * the user experience during loading states.
 *
 * @param props - LoadingContainerProps containing children and ready state
 * @returns JSX element containing the animated content container
 *
 * @example
 * ```typescript
 * <LoadingContainer isReady={isDataLoaded}>
 *   <DataContent />
 * </LoadingContainer>
 * ```
 */
export const LoadingContainer: React.FC<LoadingContainerProps> = ({
  children,
  isReady,
}) => {
  // Create shared values for opacity
  const contentOpacity = useSharedValue(isReady ? 1 : 0);

  // Update animations when isReady changes
  useEffect(() => {
    contentOpacity.value = withTiming(isReady ? 1 : 0, {
      duration: 800,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isReady, contentOpacity]);

  // Create animated styles
  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  return (
    <View style={styles.animatedContainer}>
      <Animated.View style={[styles.content, contentAnimatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  animatedContainer: {
    flex: 1,
    position: 'relative',
  },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  content: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
});
