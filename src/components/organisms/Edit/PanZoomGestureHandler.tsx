import { useCallback, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue } from 'react-native-reanimated';
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
}) => {
  const {
    scale,
    translate,
    panGesture: contextPanGestureRef,
    minScale,
    maxScale,
    contentSize,
  } = usePanZoomContext();

  // save the scale and translate values to be used in the pinch gesture to prevent jittering
  const savedScale = useRef(scale.value);
  const savedTranslate = useRef(translate.value);
  const savedFocalPoint = useRef({ x: 0, y: 0 });

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
          savedTranslate.current = translate.value;
        })
        .onUpdate((e) => {
          'worklet';
          const { x, y } = savedTranslate.current;
          const newX = x + e.translationX / scale.value;
          const newY = y + e.translationY / scale.value;
          updateTranslate(newX, newY);
        })
        .onEnd(() => {
          'worklet';
        })
        .withRef(contextPanGestureRef),
    [contextPanGestureRef, savedTranslate, scale, updateTranslate, translate]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(true)
        .onStart((e) => {
          'worklet';
          savedScale.current = scale.value;
          savedFocalPoint.current = {
            x: e.focalX,
            y: e.focalY,
          };
        })
        .onUpdate((e) => {
          'worklet';

          // update scale
          const { scale: eventScale } = e;
          const newScale = updateScale(savedScale.current * eventScale);

          // update translate to keep the focal point in the same position
          const { x: focalX, y: focalY } = savedFocalPoint.current;
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
    const absoluteFocalX = e.clientX / savedScale.current;
    const absoluteFocalY = e.clientY / savedScale.current;

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

  // Assigned synchronously during render, not in an effect: PointGestureHandler
  // (a descendant, rendered as `children` below) reads
  // parentPanGesture.current directly in its own render body via
  // `usePanZoomContext()`, and effects only run after the whole subtree has
  // committed. Deferring this to an effect would leave it undefined for
  // every render of PointGestureHandler up to the first one caused by
  // something else, silently breaking blocksExternalGesture.
  contextPanGestureRef.current = panGesture;

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
