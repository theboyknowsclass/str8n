import { PanZoomContext } from '@contexts/PanZoomContext';
import { useCallback, useContext, useMemo } from 'react';
import { Dimensions } from '@types';
import { View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

interface PanZoomProps {
  children?: React.ReactNode | React.ReactNode[];
  contentSize: Dimensions;
  controlSize: Dimensions;
  maxScale?: number;
  minScale?: number;
}

export const PanZoomControl: React.FC<PanZoomProps> = ({
  children,
  contentSize,
  controlSize,
  maxScale = 1,
  minScale = 0.1,
}) => {
  const {
    scale,
    translate,
    panGesture: contextPanGesture,
  } = useContext(PanZoomContext);

  const savedScale = useSharedValue(scale.value);
  const savedTranslate = useSharedValue(translate.value);
  const savedFocalPoint = useSharedValue({ x: 0, y: 0 });

  const windowWidth = useDerivedValue(() => {
    return controlSize.width / scale.value;
  });
  const maxX = useDerivedValue(() => {
    return -contentSize.width + windowWidth.value;
  });

  const windowHeight = useDerivedValue(() => {
    return controlSize.height / scale.value;
  });
  const maxY = useDerivedValue(() => {
    return -contentSize.height + windowHeight.value;
  });

  const updateTranslate = useCallback(
    (x: number, y: number) => {
      'worklet';
      translate.value = {
        x: Math.min(0, Math.max(x, maxX.value)),
        y: Math.min(0, Math.max(y, maxY.value)),
      };
    },
    [maxX, maxY, translate]
  );

  const updateScale = useCallback(
    (newScale: number) => {
      'worklet';
      scale.value = Math.max(minScale, Math.min(newScale, maxScale));
      return scale.value;
    },
    [maxScale, minScale, scale]
  );

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .maxPointers(1)
        .minDistance(0)
        .onStart(() => {
          'worklet';
          savedTranslate.value = translate.value;
        })
        .onUpdate((e) => {
          'worklet';
          const { x, y } = savedTranslate.value;
          const newX = x + e.translationX / scale.value;
          const newY = y + e.translationY / scale.value;
          updateTranslate(newX, newY);
        })
        .onEnd(() => {
          'worklet';
        })
        .withRef(contextPanGesture),
    [contextPanGesture, savedTranslate, scale, updateTranslate, translate]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(true)
        .onStart((e) => {
          'worklet';
          savedScale.value = scale.value;
          savedFocalPoint.value = {
            x: e.focalX,
            y: e.focalY,
          };
        })
        .onUpdate((e) => {
          'worklet';

          // update scale
          const { scale: eventScale } = e;
          const newScale = updateScale(savedScale.value * eventScale);

          // update translate to keep the focal point in the same position
          const { x: focalX, y: focalY } = savedFocalPoint.value;
          const newWindowWidth = controlSize.width / newScale;
          const newWindowHeight = controlSize.height / newScale;
          const newX = -focalX + newWindowWidth / 2;
          const newY = -focalY + newWindowHeight / 2;
          updateTranslate(newX, newY);
        })
        .onEnd(() => {
          'worklet';
        }),
    [
      savedFocalPoint,
      savedScale,
      scale,
      updateTranslate,
      controlSize,
      updateScale,
    ]
  );

  const handleWheel = (e: WheelEvent) => {
    // Prevent default scrolling behavior
    e.preventDefault();

    // Use mouse pointer position as focal point
    const absoluteFocalX = e.clientX / savedScale.value;
    const absoluteFocalY = e.clientY / savedScale.value;

    // Calculate zoom factor based on wheel delta
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = updateScale(scale.value * zoomFactor);

    // Update translate to keep the focal point in the same position
    const newWindowWidth = controlSize.width / newScale;
    const newWindowHeight = controlSize.height / newScale;
    const newX = -absoluteFocalX + newWindowWidth / 2;
    const newY = -absoluteFocalY + newWindowHeight / 2;
    updateTranslate(newX, newY);
  };

  contextPanGesture.current = panGesture;

  // Combine both gestures
  const composedGesture = Gesture.Exclusive(panGesture, pinchGesture);

  const layoutStyle = {
    width: contentSize.width,
    height: contentSize.height,
    transformOrigin: 'top left',
  };

  const transformStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateX: translate.value.x },
      { translateY: translate.value.y },
    ],
  }));

  return (
    <View
      style={{
        position: 'relative',
        width: controlSize.width,
        height: controlSize.height,
        pointerEvents: 'box-none',
      }}
      {...(Platform.OS === 'web' ? { onWheel: handleWheel } : {})}
    >
      <GestureDetector gesture={composedGesture}>
        <Animated.View style={[layoutStyle, transformStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
