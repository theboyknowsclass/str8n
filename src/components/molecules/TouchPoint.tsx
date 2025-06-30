import React, { useCallback } from 'react';
import { StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { useOverlayStore, useSourceImageStore } from '@stores';
import { Corner, MovablePoint, Point } from '@types';
import { useTheme } from '@react-navigation/native';
import { usePanZoomContext } from '@hooks';

/**
 * Props for the TouchPoint component.
 * @property index - The corner index this point represents (0-3)
 * @property position - Shared value containing the absolute position of the point
 */
type TouchPointProps = {
  index: Corner;
  position: MovablePoint;
};

const SIZE = 64;
const STROKE = 12;

/**
 * TouchPoint component that provides interactive corner point manipulation.
 *
 * This component renders a draggable corner point for the selection overlay.
 * It supports pan gestures for repositioning, visual feedback during interaction,
 * and automatically updates the overlay store when moved. The point size and
 * stroke scale with the current zoom level.
 *
 * @param props - TouchPointProps containing index and position
 * @returns JSX element containing the interactive touch point
 *
 * @example
 * ```typescript
 * <TouchPoint index={Corner.TOP_LEFT} position={positionSharedValue} />
 * ```
 */
export const TouchPoint: React.FC<TouchPointProps> = ({
  index,
  position: absolutePosition,
}) => {
  const { scale, panGesture: parentPanGesture } = usePanZoomContext();
  const updatePoint = useOverlayStore((state) => state.updatePoint);
  const theme = useTheme();

  const { sourceImage } = useSourceImageStore();
  const { width: imageWidth, height: imageHeight } = sourceImage.dimensions;

  // allows for animating the point to be larger when active
  const savedAbsolutePosition = useSharedValue({
    x: 0,
    y: 0,
    isActive: false,
  });

  const activationScale = useDerivedValue(() => {
    return withTiming(absolutePosition.isActive.value ? 1.2 : 1, {
      duration: 100,
    });
  });
  const pointSize = useDerivedValue(() => SIZE / scale.value);
  const pointStroke = useDerivedValue(() => STROKE / scale.value);
  const pointRadius = useDerivedValue(() => pointSize.value / 2);

  const convertToRelative = useCallback(
    (absoluteX: number, absoluteY: number): Point => {
      'worklet';
      return {
        x: Math.max(0, Math.min(1, absoluteX / imageWidth)),
        y: Math.max(0, Math.min(1, absoluteY / imageHeight)),
      };
    },
    [imageWidth, imageHeight]
  );

  const relativePosition = useDerivedValue(() => {
    return convertToRelative(
      absolutePosition.x.value,
      absolutePosition.y.value
    );
  });

  const updateStore = useCallback(
    (x: number, y: number) => {
      updatePoint(index, { x, y });
    },
    [index, updatePoint]
  );

  // Create a pan gesture for a point
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .runOnJS(false)
    .minDistance(0)
    .onStart(() => {
      'worklet';
      absolutePosition.isActive.value = true;
      savedAbsolutePosition.value = {
        x: absolutePosition.x.value,
        y: absolutePosition.y.value,
        isActive: absolutePosition.isActive.value,
      };
    })
    .onUpdate((e) => {
      'worklet';

      const scaledTranslationX = e.translationX / scale.value;
      const scaledTranslationY = e.translationY / scale.value;

      absolutePosition.x.value = Math.max(
        0,
        Math.min(imageWidth, savedAbsolutePosition.value.x + scaledTranslationX)
      );

      absolutePosition.y.value = Math.max(
        0,
        Math.min(
          imageHeight,
          savedAbsolutePosition.value.y + scaledTranslationY
        )
      );
    })
    .onEnd(() => {
      'worklet';
      absolutePosition.isActive.value = false;
      runOnJS(updateStore)(relativePosition.value.x, relativePosition.value.y);
    })
    .blocksExternalGesture(parentPanGesture.current!);

  // Animated styles for the point
  const animatedStyles = useAnimatedStyle(() => {
    'worklet';
    const currentScale = activationScale.value;
    return {
      transform: [{ scale: currentScale }],
      left: absolutePosition.x.value - pointRadius.value,
      top: absolutePosition.y.value - pointRadius.value,
      width: pointSize.value,
      height: pointSize.value,
      borderRadius: pointRadius.value,
      borderWidth: pointStroke.value,
      borderColor: absolutePosition.isActive.value
        ? `${theme.colors.primary}90`
        : 'rgba(255, 255, 255, 0.5)',
    };
  });

  // const composedGesture = Gesture.Simultaneous(panGesture, tapGesture);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.touchPoint, animatedStyles]} />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  touchPoint: {
    position: 'absolute',
    backgroundColor: 'transparent',
    zIndex: 4,
  },
});
