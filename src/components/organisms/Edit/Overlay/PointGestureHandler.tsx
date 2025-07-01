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

type PointGestureHandlerProps = {
  point: MovablePoint;
  initialPointSize: number;
  scaledImageHeight: SharedValue<number>;
  scaledImageWidth: SharedValue<number>;
};

export const PointGestureHandler: React.FC<PointGestureHandlerProps> = ({
  point,
  initialPointSize,
  scaledImageHeight,
  scaledImageWidth,
}) => {
  const { panGesture: parentPanGesture } = usePanZoomContext();

  const savedPosition = useRef<Point>({
    x: point.x.value,
    y: point.y.value,
  });

  const cx = useDerivedValue(() => {
    return point.x.value * scaledImageWidth.value;
  }, [point, scaledImageWidth]);
  const cy = useDerivedValue(() => {
    return point.y.value * scaledImageHeight.value;
  }, [point, scaledImageHeight]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      top: cy.value - initialPointSize / 2,
      left: cx.value - initialPointSize / 2,
      width: initialPointSize,
      height: initialPointSize,
      borderRadius: initialPointSize / 2,
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
