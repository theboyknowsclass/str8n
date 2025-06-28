import { View, StyleSheet, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Props for the SafeAreaView component.
 * @property children - React nodes to render inside the safe area container
 */
interface SafeAreaViewProps extends ViewProps {
  children: React.ReactNode;
}

/**
 * SafeAreaView component that provides safe area padding for different devices.
 *
 * This component creates a full-screen container that automatically applies
 * safe area insets to ensure content is not hidden behind device-specific
 * UI elements like notches, status bars, or home indicators. It uses a
 * minimum padding of 16px when safe area insets are smaller.
 *
 * @param props - SafeAreaViewProps extending ViewProps with children
 * @returns JSX element containing the safe area container with children
 *
 * @example
 * ```typescript
 * <SafeAreaView>
 *   <Text>Content that respects safe areas</Text>
 * </SafeAreaView>
 * ```
 */
export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  ...rest
}) => {
  const insets = useSafeAreaInsets();

  const safeViewStyle = {
    paddingTop: Math.max(insets.top, 16),
    paddingBottom: Math.max(insets.bottom, 16),
    paddingLeft: Math.max(insets.left, 16),
    paddingRight: Math.max(insets.right, 16),
  };

  return (
    <View style={[styles.container, safeViewStyle, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
