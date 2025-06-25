import { useTheme } from '@react-navigation/native';
import { useEffect, useMemo } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ModalDialogProps {
  children: React.ReactNode;
  isVisible: boolean;
}

const ANIMATION_DURATION = 500; // Default duration for animations, aligned with the hook's default.

export const ModalDialog: React.FC<ModalDialogProps> = ({
  children,
  isVisible,
}) => {
  const {
    colors: { background },
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
      {children}
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
    zIndex: 1000,
    borderWidth: 0,
  },
});
