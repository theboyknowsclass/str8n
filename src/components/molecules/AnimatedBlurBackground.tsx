import { useTheme } from '@react-navigation/native';
import { BlurView } from 'expo-blur';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Easing, StyleSheet } from 'react-native';
import { useEffect, useState } from 'react';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

interface AnimatedBlurBackgroundProps {
  children: React.ReactNode;
  isVisible: boolean;
}

export const AnimatedBlurBackground: React.FC<AnimatedBlurBackgroundProps> = ({
  children,
  isVisible,
}) => {
  const [display, setDisplay] = useState<'flex' | 'none'>(
    isVisible ? 'flex' : 'none'
  );

  const { dark } = useTheme();
  const blurTint = dark ? 'dark' : 'light';
  const blurIntensity = useSharedValue(isVisible ? 70 : 0);
  const animatedProps = useAnimatedProps(() => {
    return {
      intensity: blurIntensity.value,
    };
  });

  useEffect(() => {
    if (isVisible) {
      setDisplay('flex');
    }
    const targetIntensity = isVisible ? 70 : 0;
    const easing = isVisible ? Easing.in(Easing.ease) : Easing.out(Easing.ease);

    blurIntensity.value = withTiming(
      targetIntensity,
      {
        duration: 500,
        easing,
      },
      (f, v) => {
        if (f && !isVisible) {
          setDisplay('none');
        }
      }
    );
  }, [isVisible, blurIntensity]);

  return (
    <AnimatedBlurView
      animatedProps={animatedProps}
      intensity={blurIntensity.value}
      tint={blurTint}
      style={[styles.blurContainer, styles.blurView, { display: display }]}
    >
      {children}
    </AnimatedBlurView>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
