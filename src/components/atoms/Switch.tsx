import { useTheme } from 'expo-router/react-navigation';
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

// CONSTANTS
// Define the physical dimensions of the switch track and thumb
const TRACK_WIDTH = 80; // Total width of the switch track
const TRACK_HEIGHT = 40; // Height of the switch track
const TRACK_PADDING = 5; // Padding inside the track for the thumb
const DURATION = 400; // Animation duration in milliseconds

/**
 * Props for the Switch component.
 * @property isOn - The switch's current state (on/off); the single source of
 * truth for what the switch displays and what a press toggles it to
 * @property value - SharedValue<boolean> kept in sync with isOn, exposed so
 * other worklets/consumers (e.g. a parent reading it after onPress) can
 * observe the switch's state without needing a React re-render. Never read
 * during render - reading a shared value's `.value` during render is
 * unsafe, since mutating it doesn't trigger a re-render
 * @property onPress - Callback function called when the switch is pressed
 * @property duration - Optional animation duration in milliseconds
 * @property trackColors - Optional custom colors for on/off states
 */
export type SwitchProps = {
  value: SharedValue<boolean>;
  isOn: boolean;
  onPress: () => void;
  duration?: number;
  trackColors?: { on: string; off: string };
};

/**
 * Switch component that provides a smooth animated toggle switch.
 *
 * This component creates a custom animated toggle switch with smooth color
 * transitions and thumb movement. It uses React Native Reanimated for
 * performant animations and automatically adapts to theme changes.
 *
 * Features:
 * - Smooth color transitions between on/off states
 * - Animated thumb movement
 * - Theme-aware colors (uses primary color for on state)
 * - Responsive to dark/light theme changes
 *
 * @param props - SwitchProps containing the switch state and callbacks
 * @returns JSX element containing the animated switch
 *
 * @example
 * ```typescript
 * const [isOn, setIsOn] = useState(false);
 * const switchValue = useSharedValue(isOn);
 *
 * <Switch
 *   value={switchValue}
 *   isOn={isOn}
 *   onPress={() => setIsOn((prev) => !prev)}
 * />
 * ```
 */
export const Switch: React.FC<SwitchProps> = ({
  value,
  isOn,
  onPress,
  duration = DURATION,
}) => {
  // Get theme information for dynamic color selection
  const {
    dark,
    colors: { primary },
  } = useTheme();
  // Theme colors in this app are always plain hex strings, never
  // PlatformColor/DynamicColorIOS, so ColorValue narrows safely to string.
  const primaryColor = primary as string;

  // Define the inactive color based on theme (darker for dark theme, lighter for light theme)
  const inActiveColor = dark
    ? 'rgba(66, 66, 66, 0.8)' // Dark gray with high opacity for dark theme
    : 'rgba(66, 66, 66, 0.3)'; // Light gray with low opacity for light theme

  // Shared values for animations
  const trackBackgroundColor = useSharedValue(
    isOn ? primaryColor : inActiveColor
  );

  const translateX = useSharedValue(isOn ? TRACK_WIDTH - TRACK_HEIGHT : 0);

  // The isOn *prop* is only fresh as of the last render, so two presses in
  // the same render cycle (e.g. a fast double-tap, before React re-renders
  // with the new isOn) would both compute their "next" value from the same
  // stale prop and fail to toggle on the second press. currentIsOn is a
  // ref instead, updated synchronously both here and in onSwitchPress
  // below, so it's always immediately current regardless of React's
  // render/prop-update timing.
  const currentIsOn = useRef(isOn);

  // Keeps currentIsOn, value, and both animated values in sync whenever
  // isOn (or the theme colors) changes for any reason other than pressing
  // this switch - e.g. an external state change. value is set directly
  // (it's not itself animated), while the visuals animate with withTiming,
  // not a plain assignment, so a self-triggered re-run (isOn flipping as a
  // result of this same press's onToggle call reaching back down as a new
  // prop) re-targets the same in-flight animation smoothly instead of
  // jump-cutting the one onSwitchPress already started.
  useEffect(() => {
    currentIsOn.current = isOn;
    value.value = isOn;
    trackBackgroundColor.value = withTiming(
      isOn ? primaryColor : inActiveColor,
      { duration }
    );
    translateX.value = withTiming(isOn ? TRACK_WIDTH - TRACK_HEIGHT : 0, {
      duration,
    });
  }, [
    value,
    primaryColor,
    inActiveColor,
    isOn,
    trackBackgroundColor,
    translateX,
    duration,
  ]);

  /**
   * Handle switch press events
   * Toggles the switch state and animates both color and position changes
   */
  const onSwitchPress = () => {
    // currentIsOn.current (not the isOn prop, and not value.value) is the
    // single source of truth for what a press means: it's always
    // immediately up to date (unlike isOn, which lags a render behind) and
    // is only ever set from isOn (unlike value, which existed purely to
    // read-and-flip and could drift). See the comment on currentIsOn above.
    const newValue = !currentIsOn.current;
    currentIsOn.current = newValue;
    value.value = newValue;

    // Interpolate color between off and on states
    const color = interpolateColor(
      Number(newValue),
      [0, 1],
      [inActiveColor, primaryColor]
    );

    // Interpolate thumb position between left and right
    const moveValue = interpolate(
      Number(newValue),
      [0, 1],
      [0, TRACK_WIDTH - TRACK_HEIGHT]
    );

    // Animate both color and position changes
    trackBackgroundColor.value = withTiming(color, { duration });
    translateX.value = withTiming(moveValue, { duration });

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
    <Pressable
      onPress={onSwitchPress}
      accessibilityLabel={`Switch ${isOn ? 'on' : 'off'}`}
      accessibilityRole="switch"
    >
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
