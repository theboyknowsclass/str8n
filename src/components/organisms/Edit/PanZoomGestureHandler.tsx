import { useCallback, useMemo } from 'react';
import { Dimensions } from '@types';
import { View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { usePanZoomContext } from '@contexts';

/**
 * Props for the PanZoomGestureHandler component.
 * @property children - React nodes to be wrapped by the pan/zoom gesture controls
 * @property width - The width of the control area
 * @property height - The height of the control area
 * @property contentSize - The dimensions of the content being controlled
 * @property maxScale - Maximum allowed scale factor (default: 1)
 * @property minScale - Minimum allowed scale factor (default: 0.1)
 */
export interface PanZoomGestureHandlerProps {
  children?: React.ReactNode | React.ReactNode[];
  width: number;
  height: number;
  contentSize: Dimensions;
  maxScale?: number;
  minScale?: number;
}

/**
 * PanZoomGestureHandler component that provides pan and zoom functionality through gesture detection.
 *
 * This component wraps content with gesture detection for panning and zooming operations.
 * It supports:
 * - Touch pan gestures on mobile devices
 * - Pinch-to-zoom gestures on mobile devices
 * - Mouse wheel zooming on web platforms
 *
 * The component maintains proper bounds checking to prevent content from being panned
 * outside the visible area and preserves focal points during zoom operations for
 * intuitive user experience.
 *
 * @param props - PanZoomGestureHandlerProps containing children and size configurations
 * @returns JSX element containing the gesture-controlled content
 *
 * @example
 * ```typescript
 * <PanZoomGestureHandler
 *   width={400}
 *   height={300}
 *   contentSize={{ width: 1000, height: 800 }}
 *   maxScale={2}
 *   minScale={0.5}
 * >
 *   <Image source={imageSource} />
 * </PanZoomGestureHandler>
 * ```
 */
export const PanZoomGestureHandler: React.FC<PanZoomGestureHandlerProps> = ({
  children,
  width,
  height,
  contentSize,
  maxScale = 1,
  minScale = 0.1,
}) => {
  const {
    scale,
    translate,
    panGesture: contextPanGesture,
  } = usePanZoomContext();

  // save the scale and translate values to be used in the pinch gesture to prevent jittering
  const savedScale = useSharedValue(scale.value);
  const savedTranslate = useSharedValue(translate.value);
  const savedFocalPoint = useSharedValue({ x: 0, y: 0 });

  const scaledWidth = useDerivedValue(() => {
    return width / scale.value;
  });
  const maxX = useDerivedValue(() => {
    return -contentSize.width + scaledWidth.value;
  });

  const scaledHeight = useDerivedValue(() => {
    return height / scale.value;
  });
  const maxY = useDerivedValue(() => {
    return -contentSize.height + scaledHeight.value;
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
          const newScaledWidth = width / newScale;
          const newScaledHeight = height / newScale;
          const newX = -focalX + newScaledWidth / 2;
          const newY = -focalY + newScaledHeight / 2;
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
      updateScale,
      width,
      height,
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
    const newWindowWidth = width / newScale;
    const newWindowHeight = height / newScale;
    const newX = -absoluteFocalX + newWindowWidth / 2;
    const newY = -absoluteFocalY + newWindowHeight / 2;
    updateTranslate(newX, newY);
  };

  contextPanGesture.current = panGesture;

  // Combine both gestures
  const composedGesture = Gesture.Exclusive(panGesture, pinchGesture);

  return (
    <View
      style={{
        position: 'relative',
        width,
        height,
        pointerEvents: 'box-none',
      }}
      {...(Platform.OS === 'web' ? { onWheel: handleWheel } : {})}
    >
      <GestureDetector gesture={composedGesture}>{children}</GestureDetector>
    </View>
  );
};
