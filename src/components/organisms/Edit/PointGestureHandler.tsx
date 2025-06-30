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
  absolutePoint: MovablePoint;
  pointRadius: SharedValue<number>;
  pointStroke: SharedValue<number>;
  imageWidth: number;
  imageHeight: number;
  canvasDimensions: { width: number; height: number };
};

export const PointGestureHandler: React.FC<PointGestureHandlerProps> = ({
  absolutePoint,
  pointRadius,
  pointStroke,
  imageWidth,
  imageHeight,
  canvasDimensions,
}) => {
  const { scale, panGesture: parentPanGesture } = usePanZoomContext();

  const initialPointSize = useRef(pointRadius.value + pointStroke.value / 2);

  const relativePoint = useDerivedValue(() => {
    return {
      x: absolutePoint.x.value / imageWidth,
      y: absolutePoint.y.value / imageHeight,
    };
  }, [absolutePoint, imageWidth, imageHeight]);

  const scaledImageWidth = useDerivedValue(() => {
    return imageWidth * scale.value;
  }, [imageWidth, scale]);
  const scaledImageHeight = useDerivedValue(() => {
    return imageHeight * scale.value;
  }, [imageHeight, scale]);

  const savedPosition = useRef<Point>({
    x: absolutePoint.x.value,
    y: absolutePoint.y.value,
  });

  const cx = useDerivedValue(() => {
    return relativePoint.value.x * scaledImageWidth.value;
  }, [relativePoint, scaledImageWidth]);
  const cy = useDerivedValue(() => {
    return relativePoint.value.y * scaledImageHeight.value;
  }, [absolutePoint.y, imageHeight, canvasDimensions]);

  const animatedStyles = useAnimatedStyle(() => {
    return {
      top: cy.value - initialPointSize.current,
      left: cx.value - initialPointSize.current,
      width: initialPointSize.current * 2,
      height: initialPointSize.current * 2,
      // borderRadius: pointSize.value,
    };
  });

  // Create a pan gesture for a point
  const panGesture = Gesture.Pan()
    .maxPointers(1)
    .runOnJS(false)
    .minDistance(0)
    .onStart(() => {
      'worklet';
      absolutePoint.isActive.value = true;
      savedPosition.current = {
        x: absolutePoint.x.value,
        y: absolutePoint.y.value,
      };
    })
    .onUpdate((e) => {
      'worklet';

      const scaledTranslationX = e.translationX / scale.value;
      const scaledTranslationY = e.translationY / scale.value;

      absolutePoint.x.value = Math.max(
        0,
        Math.min(imageWidth, savedPosition.current.x + scaledTranslationX)
      );

      absolutePoint.y.value = Math.max(
        0,
        Math.min(imageHeight, savedPosition.current.y + scaledTranslationY)
      );
    })
    .onEnd(() => {
      'worklet';
      absolutePoint.isActive.value = false;
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
    zIndex: 4,
  },
});
