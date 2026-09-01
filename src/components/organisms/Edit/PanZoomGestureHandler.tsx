import { useCallback, useMemo } from 'react';
import { View, Platform } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useDerivedValue, useSharedValue } from 'react-native-reanimated';
import { usePanZoomContext } from '@contexts';
import { computeZoomAroundPointTranslate } from '@utils/panZoomTransformUtils';

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
    initialScale,
    initialTranslate,
  } = usePanZoomContext();

  // Save the scale/translate/focal-point values to be used in the pinch
  // gesture to prevent jittering. These must be Reanimated shared values,
  // not plain React refs: a plain `useRef().current` mutated inside one
  // worklet (e.g. onStart) is not reliably visible when read from a
  // different worklet (e.g. onUpdate) on the UI thread - confirmed live via
  // debug logging, where savedFocalPoint.current read back as its stale
  // {x:0,y:0} initial value inside onUpdate despite onStart just having set
  // it to the real touch position. Shared values are the only construct
  // Reanimated guarantees stays in sync across worklet callbacks and
  // threads. Seeded from the plain initialScale/initialTranslate values
  // (not scale.value/translate.value) since reading a shared value's .value
  // during render is unsafe - scale/translate are guaranteed to still equal
  // these at first mount anyway (PanZoomContextProvider seeds them with the
  // same values), and both are overwritten by the real current value in the
  // pinch/pan gestures' onStart before ever being read there. (handleWheel
  // below reads scale.value directly instead of savedScale.value, since it
  // isn't part of the pinch gesture sequence.)
  const savedScale = useSharedValue(initialScale);
  const savedTranslate = useSharedValue(initialTranslate);
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
        .withRef(contextPanGestureRef),
    [contextPanGestureRef, savedTranslate, scale, updateTranslate, translate]
  );

  const pinchGesture = useMemo(
    () =>
      Gesture.Pinch()
        .enabled(true)
        .onStart((e) => {
          'worklet';
          savedScale.value = scale.value;
          savedTranslate.value = translate.value;
          savedFocalPoint.value = {
            x: e.focalX,
            y: e.focalY,
          };
        })
        .onUpdate((e) => {
          'worklet';

          // update scale
          const { scale: eventScale } = e;
          const oldScale = savedScale.value;
          const newScale = updateScale(oldScale * eventScale);

          // Keep the focal point (the pinch's starting midpoint) visually
          // stationary on screen as scale changes, via the standard
          // "zoom around a point" formula (see panZoomTransformUtils.ts for
          // why this applies directly to the raw translate, even though
          // what's actually drawn goes through a second, derived transform -
          // the mount-time constants in that derivation cancel out
          // algebraically for this particular calculation).
          const newTranslate = computeZoomAroundPointTranslate(
            savedFocalPoint.value,
            savedTranslate.value,
            oldScale,
            newScale
          );
          updateTranslate(newTranslate.x, newTranslate.y);
        })
        .onEnd(() => {
          'worklet';
        }),
    [
      savedFocalPoint,
      savedScale,
      savedTranslate,
      scale,
      translate,
      updateTranslate,
      updateScale,
    ]
  );

  const handleWheel = (e: WheelEvent) => {
    // Prevent default scrolling behavior
    e.preventDefault();

    // e.clientX/clientY are relative to the browser viewport, not this
    // element - convert to element-relative coordinates so the focal point
    // matches what the pinch gesture's e.focalX/focalY represent natively
    // (relative to the view the gesture is attached to). Without this, wheel
    // zoom mis-centers whenever the edit control isn't at the window origin.
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const focalX = e.clientX - rect.left;
    const focalY = e.clientY - rect.top;

    // Same zoom-around-a-point computation as the pinch gesture above, using
    // the mouse cursor position as the focal point.
    const oldScale = scale.value;
    const zoomFactor = e.deltaY > 0 ? 0.95 : 1.05;
    const newScale = updateScale(oldScale * zoomFactor);

    const newTranslate = computeZoomAroundPointTranslate(
      { x: focalX, y: focalY },
      translate.value,
      oldScale,
      newScale
    );
    updateTranslate(newTranslate.x, newTranslate.y);
  };

  // Assigned synchronously during render, not in an effect: PointGestureHandler
  // (a descendant, rendered as `children` below) reads
  // parentPanGesture.current directly in its own render body via
  // `usePanZoomContext()`, and effects only run after the whole subtree has
  // committed. Deferring this to an effect would leave it undefined for
  // every render of PointGestureHandler up to the first one caused by
  // something else, silently breaking blocksExternalGesture.
  contextPanGestureRef.current = panGesture;

  // Simultaneous, not Exclusive: Exclusive makes every gesture after the
  // first require the earlier ones to explicitly fail before it can even
  // start recognizing (see requireToFail chaining in
  // react-native-gesture-handler's GestureComposition.ts) - so pinchGesture
  // would have to wait for panGesture to fail first. Since panGesture uses
  // minDistance(0), it goes active on the very first touch point, before a
  // second finger for a pinch can possibly be down yet, so pinchGesture
  // could be starved or the two could fight over the same translate/scale
  // values mid-gesture. maxPointers(1) on panGesture alone is what should
  // keep it out of pinch's way - this is the standard RNGH pattern for
  // combining a single-finger pan with a two-finger pinch.
  const composedGesture = Gesture.Simultaneous(panGesture, pinchGesture);

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
