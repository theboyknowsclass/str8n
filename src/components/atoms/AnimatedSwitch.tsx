import { useTheme } from '@react-navigation/native';
import React, { useEffect, useRef } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type AnimatedSwitchProps = {
  value: SharedValue<boolean>;
  onPress: () => void;
  duration?: number;
  trackColors?: { on: string; off: string };
};

export const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  value,
  onPress,
}) => {
  const height = useSharedValue(0);
  const width = useSharedValue(0);
  const duration = 400;
  const isInitialRender = useRef(true);
  const {
    dark,
    colors: { primary },
  } = useTheme();

  const inActiveColor = dark
    ? 'rgba(66, 66, 66, 0.8)'
    : 'rgba(66, 66, 66, 0.3)';

  const trackAnimatedStyle = useAnimatedStyle(() => {
    const color = interpolateColor(
      Number(value.value),
      [0, 1],
      [inActiveColor, primary]
    );

    // Don't animate on initial render
    const colorValue = isInitialRender.current
      ? color
      : withTiming(color, { duration });

    return {
      backgroundColor: colorValue,
      borderRadius: height.value / 2,
    };
  });

  const thumbAnimatedStyle = useAnimatedStyle(() => {
    const moveValue = interpolate(
      Number(value.value),
      [0, 1],
      [0, width.value - height.value]
    );

    // Don't animate on initial render
    const translateValue = isInitialRender.current
      ? moveValue
      : withTiming(moveValue, { duration });

    return {
      transform: [{ translateX: translateValue }],
      borderRadius: height.value / 2,
    };
  });

  // Mark that initial render is complete after layout
  useEffect(() => {
    const timer = setTimeout(() => {
      isInitialRender.current = false;
    }, 100); // Small delay to ensure layout is complete

    return () => clearTimeout(timer);
  }, []);

  return (
    <Pressable onPress={onPress}>
      <Animated.View
        onLayout={(e) => {
          height.value = e.nativeEvent.layout.height;
          width.value = e.nativeEvent.layout.width;
        }}
        style={[switchStyles.track, trackAnimatedStyle]}
      >
        <Animated.View
          style={[switchStyles.thumb, thumbAnimatedStyle]}
        ></Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const switchStyles = StyleSheet.create({
  track: {
    alignItems: 'flex-start',
    width: 80,
    height: 40,
    padding: 5,
  },
  thumb: {
    height: '100%',
    aspectRatio: 1,
    backgroundColor: 'white',
  },
});
