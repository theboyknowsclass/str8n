import { useTheme } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

// CONSTANTS
// Define the physical dimensions of the switch track and thumb
const TRACK_WIDTH = 80; // Total width of the switch track
const TRACK_HEIGHT = 40; // Height of the switch track
const TRACK_PADDING = 5; // Padding inside the track for the thumb
const DURATION = 400; // Animation duration in milliseconds

/**
 * Props for the AnimatedSwitch component
 * @param value - SharedValue<boolean> that controls the switch state (on/off)
 * @param onPress - Callback function called when the switch is pressed
 * @param duration - Optional animation duration in milliseconds
 * @param trackColors - Optional custom colors for on/off states
 */
export type AnimatedSwitchProps = {
  value: SharedValue<boolean>;
  onPress: () => void;
  duration?: number;
  trackColors?: { on: string; off: string };
};

/**
 * AnimatedSwitch - A custom animated toggle switch component
 *
 * Features:
 * - Smooth color transitions between on/off states
 * - Animated thumb movement
 * - Theme-aware colors (uses primary color for on state)
 * - Responsive to dark/light theme changes
 */
export const AnimatedSwitch: React.FC<AnimatedSwitchProps> = ({
  value,
  onPress,
}) => {
  // Get theme information for dynamic color selection
  const {
    dark,
    colors: { primary },
  } = useTheme();

  // Define the inactive color based on theme (darker for dark theme, lighter for light theme)
  const inActiveColor = dark
    ? 'rgba(66, 66, 66, 0.8)' // Dark gray with high opacity for dark theme
    : 'rgba(66, 66, 66, 0.3)'; // Light gray with low opacity for light theme

  // Shared values for animations
  const trackBackgroundColor = useSharedValue(
    value.value ? primary : inActiveColor
  );

  useEffect(() => {
    trackBackgroundColor.value = value.value ? primary : inActiveColor;
  }, [primary, inActiveColor, value, trackBackgroundColor]);

  const translateX = useSharedValue(
    value.value ? TRACK_WIDTH - TRACK_HEIGHT : 0
  );

  /**
   * Handle switch press events
   * Toggles the switch state and animates both color and position changes
   */
  const onSwitchPress = () => {
    // Toggle the switch value
    value.value = !value.value;

    // Interpolate color between off and on states
    const color = interpolateColor(
      Number(value.value),
      [0, 1],
      [inActiveColor, primary]
    );

    // Interpolate thumb position between left and right
    const moveValue = interpolate(
      Number(value.value),
      [0, 1],
      [0, TRACK_WIDTH - TRACK_HEIGHT]
    );

    // Animate both color and position changes
    trackBackgroundColor.value = withTiming(color, { duration: DURATION });
    translateX.value = withTiming(moveValue, { duration: DURATION });

    // Call the provided onPress callback
    onPress();
  };

  /**
   * Animated style for the track background color
   * Updates the track's background color based on the shared value
   */
  const trackAnimatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: trackBackgroundColor.value,
    };
  });

  /**
   * Animated style for the thumb position
   * Updates the thumb's horizontal position based on the shared value
   */
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <Pressable onPress={onSwitchPress}>
      {/* Track container - holds the background color and thumb */}
      <Animated.View style={[switchStyles.track, trackAnimatedStyle]}>
        {/* Thumb - the moving part of the switch */}
        <Animated.View
          style={[switchStyles.thumb, thumbAnimatedStyle]}
        ></Animated.View>
      </Animated.View>
    </Pressable>
  );
};

// Styles for the switch components
const switchStyles = StyleSheet.create({
  // Track styles - the main container of the switch
  track: {
    alignItems: 'flex-start', // Align thumb to the start (left)
    width: TRACK_WIDTH, // Fixed width from constant
    height: TRACK_HEIGHT, // Fixed height from constant
    padding: TRACK_PADDING, // Internal padding for thumb spacing
    borderRadius: TRACK_HEIGHT / 2, // Rounded corners (half height for pill shape)
  },
  // Thumb styles - the moving indicator
  thumb: {
    height: '100%', // Fill the available height
    aspectRatio: 1, // Make it square (1:1 ratio)
    backgroundColor: 'white', // White background for contrast
    borderRadius: (TRACK_HEIGHT - TRACK_PADDING * 2) / 2, // Rounded corners (accounting for padding)
  },
});
