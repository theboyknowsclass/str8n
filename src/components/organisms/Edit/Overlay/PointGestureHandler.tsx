import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';
import { MovablePoint, Point } from '@types';
import { usePanZoomContext } from '@contexts';
import { useRef } from 'react';
import { POINT_SIZE } from './constants';

/**
 * Props for the PointGestureHandler component.
 * @property point - The MovablePoint object to manipulate
 * @property scaledImageHeight - Shared animated value for the scaled image height
 * @property scaledImageWidth - Shared animated value for the scaled image width
 */
type PointGestureHandlerProps = {
  point: MovablePoint;
  scaledImageHeight: SharedValue<number>;
  scaledImageWidth: SharedValue<number>;
};

/**
 * PointGestureHandler component that enables drag gestures for a point on the overlay.
 *
 * This component uses react-native-gesture-handler and reanimated to allow users to drag
 * points interactively, updating their position in relative coordinates. Used in the selection overlay.
 *
 * The point size is now controlled by UX constants and no longer needs to be passed as a prop.
 *
 * @param props - PointGestureHandlerProps containing point and scaling info
 * @returns JSX element containing the gesture handler
 *
 * @example
 * ```tsx
 * <PointGestureHandler point={p} scaledImageWidth={w} scaledImageHeight={h} />
 * ```
 */
export const PointGestureHandler: React.FC<PointGestureHandlerProps> = ({
  point,
  scaledImageHeight,
  scaledImageWidth,
}) => {
  const { panGesture: parentPanGesture } = usePanZoomContext();

  // Seeded with a static placeholder rather than reading point.x.value/
  // point.y.value here (unsafe during render) - the real current position is
  // written into this ref inside the pan gesture's onStart below, always
  // before savedPosition.current is ever read in onUpdate.
  const savedPosition = useRef<Point>({ x: 0, y: 0 });

  const cx = useDerivedValue(() => {
    return point.x.value * scaledImageWidth.value;
  }, [point, scaledImageWidth]);
  const cy = useDerivedValue(() => {
    return point.y.value * scaledImageHeight.value;
  }, [point, scaledImageHeight]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      top: cy.value - POINT_SIZE / 2,
      left: cx.value - POINT_SIZE / 2,
      width: POINT_SIZE,
      height: POINT_SIZE,
      borderRadius: POINT_SIZE / 2,
    };
  });

  // Create a pan gesture for a point
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .runOnJS(false)
    .minDistance(0)
    .onStart(() => {
      'worklet';
      point.isActive.value = true;
      savedPosition.current = {
        x: point.x.value,
        y: point.y.value,
      };
    })
    .onUpdate((e) => {
      'worklet';
      // calculate new position in relative coordinates
      const newX =
        savedPosition.current.x + e.translationX / scaledImageWidth.value;
      const newY =
        savedPosition.current.y + e.translationY / scaledImageHeight.value;

      point.x.value = Math.max(0, Math.min(1, newX));
      point.y.value = Math.max(0, Math.min(1, newY));
      point.absoluteX.value = e.absoluteX;
      point.absoluteY.value = e.absoluteY;
    })
    .onEnd(() => {
      'worklet';
      point.isActive.value = false;
    })
    .blocksExternalGesture(parentPanGesture.current!);

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.touchPoint, animatedStyles]} />
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  touchPoint: {
    position: 'absolute',
    pointerEvents: 'auto',
    zIndex: 4,
  },
});
