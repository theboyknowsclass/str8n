import { useTheme } from '@react-navigation/native';
import { useEffect } from 'react';
import { Easing, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

interface ModalDialogProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export const ModalDialog: React.FC<ModalDialogProps> = ({
  children,
  isVisible,
}) => {
  const { dark } = useTheme();

  const opacity = useSharedValue(isVisible ? 1 : 0);
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      backgroundColor: dark
        ? 'rgba(50, 50, 50, 0.7)'
        : 'rgba(210, 210, 210, 0.7)',
    };
  });

  useEffect(() => {
    opacity.value = withTiming(isVisible ? 1 : 0, {
      duration: 300,
      easing: Easing.inOut(Easing.ease),
    });
  }, [isVisible, opacity]);

  return (
    <Animated.View style={[styles.modalContainer, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    minWidth: '30%',
    minHeight: '30%',
    width: 'auto',
    height: 'auto',
    display: 'flex',
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});
