import type { Vector } from '@types';

/**
 * The Edit screen's pan/zoom state (PanZoomContext's `scale`/`translate`) is
 * not what actually gets drawn - it goes through a second transform before
 * reaching Skia. This module is the single place that relationship is
 * defined, so the rendering code (deriveSkiaTranslate, used by
 * SelectionControl to position the image/overlay) can be tested independently
 * of Skia/Reanimated.
 *
 * Per Skia's Group `transform` prop (see processTransform3d in
 * @shopify/react-native-skia), a transform array composes as matrix
 * multiplication in array order, which means the *last* entry is applied to
 * a point first. ImageView's Group transform is
 * `[{translateX}, {translateY}, {scale}]`, so a content-space point p maps
 * to screen as `p * rawScale + skiaTranslate` (scale first, then translate) -
 * not `(p + skiaTranslate) * rawScale` as an earlier version of this file
 * assumed. That wrong assumption made computeZoomAroundPointTranslate
 * validate an invariant that didn't match what's actually rendered; it was
 * caught by code review and confirmed against Skia's source and numerically
 * before this fix. See computeZoomAroundPointTranslate below for how the
 * zoom-around-a-point solve actually works once you substitute
 * deriveSkiaTranslate's formula into the correct composition: the mount-time
 * constants cancel out algebraically, leaving the same simple formula that
 * would apply to a single, un-derived translate/scale pair.
 */

/**
 * Parameters deriveSkiaTranslate needs: the constants established once when
 * the Edit screen mounts (from PanZoomContext) and never change for the
 * lifetime of a given image/viewport.
 * @property initialTranslate - PanZoomContext's translate value at mount
 * @property initialTopLeft - Offset that centers the image within its
 * bordered content area at initialScale (see editControlUtils.ts)
 * @property initialScale - PanZoomContext's scale value at mount
 */
type PanZoomConstants = {
  initialTranslate: Vector;
  initialTopLeft: Vector;
  initialScale: number;
};

/**
 * Derives the actual Skia-space translate (what ImageView/OverlayControl
 * apply to their Group transform) from PanZoomContext's raw translate/scale
 * state. This is the exact formula SelectionControl.tsx uses to position
 * the image and overlay - extracted here so it's shared, not duplicated,
 * and can be tested independently of Skia/Reanimated.
 *
 * @param rawTranslate - PanZoomContext's current translate value
 * @param rawScale - PanZoomContext's current scale value
 * @param constants - The mount-time constants from PanZoomConstants
 * @returns The translate Skia applies after its own scale (see module docs)
 *
 * @example
 * ```typescript
 * const skiaTranslate = deriveSkiaTranslate(translate.value, scale.value, {
 *   initialTranslate,
 *   initialTopLeft,
 *   initialScale,
 * });
 * ```
 */
export const deriveSkiaTranslate = (
  rawTranslate: Vector,
  rawScale: number,
  { initialTranslate, initialTopLeft, initialScale }: PanZoomConstants
): Vector => {
  'worklet';
  const relativeScale = rawScale / initialScale;
  return {
    x:
      (rawTranslate.x - initialTranslate.x) * rawScale -
      initialTopLeft.x * relativeScale,
    y:
      (rawTranslate.y - initialTranslate.y) * rawScale -
      initialTopLeft.y * relativeScale,
  };
};

/**
 * Computes the new PanZoomContext translate needed to keep a screen-space
 * focal point (the pinch gesture's midpoint, or the mouse cursor for wheel
 * zoom) visually stationary while scale changes from oldScale to newScale.
 *
 * Substituting deriveSkiaTranslate's formula into the real render
 * composition (screen = content*rawScale + skiaTranslate) and simplifying
 * shows screen = rawScale * (content + rawTranslate - K), where K is a
 * constant that depends only on the mount-time values. Solving "the same
 * content point stays under the same screen-space focal point as scale goes
 * from oldScale to newScale" makes K cancel out entirely, leaving the
 * textbook zoom-around-a-point formula applied directly to the raw
 * translate - no mount-time constants needed.
 *
 * @param focalPoint - Screen-space point to keep stationary (relative to
 * the view the gesture is attached to)
 * @param oldRawTranslate - PanZoomContext's translate value before this update
 * @param oldScale - PanZoomContext's scale value before this update
 * @param newScale - PanZoomContext's scale value after this update
 * @returns The new value to write into PanZoomContext's translate
 */
export const computeZoomAroundPointTranslate = (
  focalPoint: Vector,
  oldRawTranslate: Vector,
  oldScale: number,
  newScale: number
): Vector => {
  'worklet';
  const scaleDelta = 1 / newScale - 1 / oldScale;
  return {
    x: oldRawTranslate.x + focalPoint.x * scaleDelta,
    y: oldRawTranslate.y + focalPoint.y * scaleDelta,
  };
};
