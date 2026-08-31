import { useTheme } from 'expo-router/react-navigation';
import { useEffect, useMemo } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { IconButton, Text } from '@atoms';

/**
 * Props for the ModalDialog component.
 * @property children - React nodes to be rendered in the modal content area
 * @property isVisible - Boolean controlling the visibility and animation state
 * @property title - Optional title text to display in the modal header
 * @property onClose - Callback function called when the close button is pressed
 */
interface ModalDialogProps {
  children: React.ReactNode;
  isVisible: boolean;
  title?: string;
  onClose: () => void;
}

const ANIMATION_DURATION = 500; // Default duration for animations, aligned with the hook's default.

/**
 * ModalDialog component that provides an animated modal dialog.
 *
 * This component renders a modal dialog with smooth fade in/out animations,
 * a header with optional title and close button, and scrollable content area.
 * It uses theme colors for consistent styling and supports both light and dark themes.
 *
 * @param props - ModalDialogProps containing children, visibility state, title, and onClose
 * @returns JSX element containing the animated modal dialog
 *
 * @example
 * ```typescript
 * <ModalDialog isVisible={showDialog} title="Confirm Action" onClose={handleClose}>
 *   <Text>Are you sure you want to proceed?</Text>
 * </ModalDialog>
 * ```
 */
export const ModalDialog: React.FC<ModalDialogProps> = ({
  children,
  isVisible,
  title,
  onClose,
}) => {
  const {
    colors: { background, primary },
    dark,
  } = useTheme();

  const opacity = useSharedValue(isVisible ? 1 : 0);

  const themedStyle = useMemo(() => {
    return {
      backgroundColor: background,
    };
  }, [background]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, opacity]);

  return (
    <Animated.View style={[styles.modalContainer, themedStyle, animatedStyle]}>
      <View style={styles.header}>
        {title ? (
          <Text size="larger" color={primary}>
            {title}
          </Text>
        ) : (
          <View style={styles.spacer} />
        )}
        <IconButton
          icon="close"
          size="small"
          accessibilityLabel="Close"
          onPress={onClose}
        />
      </View>
      <ScrollView
        showsVerticalScrollIndicator={true}
        showsHorizontalScrollIndicator={false}
        indicatorStyle={dark ? 'black' : 'white'}
      >
        {children}
      </ScrollView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    position: 'relative',
    maxWidth: '90%',
    maxHeight: '90%',
    padding: 16,
    borderRadius: 16,
    boxShadow: '0px 0px 8px 4px rgba(0, 0, 0, 0.20)',
    borderWidth: 0,
  },
  header: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  spacer: {
    flex: 1,
  },
});
