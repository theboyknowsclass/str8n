import type { Vector } from '@types';

/**
 * The Edit screen's pan/zoom state (PanZoomContext's `scale`/`translate`) is
 * not what actually gets drawn - it goes through a second transform before
 * reaching Skia. This module is the single place that relationship is
 * defined, so both the code that *reads* it (deriveSkiaTranslate, used by
 * SelectionControl to position the image/overlay) and the code that *solves
 * for a target value in it* (computeZoomAroundPointTranslate, used by the
 * pinch/wheel gesture handlers) stay in sync and can be unit-tested without
 * a device or a running app.
 *
 * The relationship (see deriveSkiaTranslate for the exact formula):
 *   screenX = (contentX + deriveSkiaTranslate(rawTranslate, rawScale)) * rawScale
 * where contentX is a fixed point in image-pixel space. This is quadratic in
 * rawScale (deriveSkiaTranslate's own result scales with rawScale, then the
 * whole sum is scaled by rawScale again), which is why the pinch/wheel zoom
 * formula can't just reuse the simple "zoom around a point" formula directly
 * on rawTranslate/rawScale - it has to invert this relationship first.
 */

/**
 * Parameters shared by both functions in this module: the constants
 * established once when the Edit screen mounts (from PanZoomContext) and
 * never change for the lifetime of a given image/viewport.
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
 * @returns The translate to apply after PanZoomContext's own scale
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
 * Inverse of deriveSkiaTranslate: given a desired Skia-space translate,
 * finds the PanZoomContext raw translate that produces it at the given
 * scale.
 */
const rawTranslateFromSkiaTranslate = (
  skiaTranslate: Vector,
  rawScale: number,
  { initialTranslate, initialTopLeft, initialScale }: PanZoomConstants
): Vector => {
  'worklet';
  return {
    x:
      initialTranslate.x +
      initialTopLeft.x / initialScale +
      skiaTranslate.x / rawScale,
    y:
      initialTranslate.y +
      initialTopLeft.y / initialScale +
      skiaTranslate.y / rawScale,
  };
};

/**
 * Computes the new PanZoomContext translate needed to keep a screen-space
 * focal point (the pinch gesture's midpoint, or the mouse cursor for wheel
 * zoom) visually stationary while scale changes from oldScale to newScale.
 *
 * This can't just apply the textbook "zoom around a point" formula
 * (newTranslate = focal * (1/newScale - 1/oldScale) + oldTranslate) directly
 * to PanZoomContext's raw translate, because raw translate isn't what's
 * actually drawn - deriveSkiaTranslate's extra terms mean the relationship
 * between raw translate and screen position isn't that simple. Instead:
 * 1. Compute the *current* Skia-space translate (via deriveSkiaTranslate).
 * 2. Apply the textbook formula to *that* value, which - being what's
 *    actually drawn - does have the simple screenX = (content + T) * scale
 *    relationship the formula assumes.
 * 3. Convert the resulting target Skia-space translate back into a raw
 *    PanZoomContext translate (via rawTranslateFromSkiaTranslate), since
 *    that's what the gesture handlers actually write to `translate.value`.
 *
 * @param focalPoint - Screen-space point to keep stationary (relative to
 * the view the gesture is attached to)
 * @param oldRawTranslate - PanZoomContext's translate value before this update
 * @param oldScale - PanZoomContext's scale value before this update
 * @param newScale - PanZoomContext's scale value after this update
 * @param constants - The mount-time constants from PanZoomConstants
 * @returns The new value to write into PanZoomContext's translate
 */
export const computeZoomAroundPointTranslate = (
  focalPoint: Vector,
  oldRawTranslate: Vector,
  oldScale: number,
  newScale: number,
  constants: PanZoomConstants
): Vector => {
  'worklet';
  const oldSkiaTranslate = deriveSkiaTranslate(
    oldRawTranslate,
    oldScale,
    constants
  );

  const scaleDelta = 1 / newScale - 1 / oldScale;
  const newSkiaTranslate: Vector = {
    x: focalPoint.x * scaleDelta + oldSkiaTranslate.x,
    y: focalPoint.y * scaleDelta + oldSkiaTranslate.y,
  };

  return rawTranslateFromSkiaTranslate(newSkiaTranslate, newScale, constants);
};
