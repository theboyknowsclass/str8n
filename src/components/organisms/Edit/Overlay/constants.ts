/**
 * UX constants for the overlay components.
 *
 * These constants define the visual appearance and interaction behavior
 * of the selection overlay points, lines, and crosshairs. They are used
 * throughout the overlay components to maintain consistent styling and
 * behavior without needing to pass them as props.
 */

/** Width of the polygon lines connecting selection points */
export const LINE_WIDTH = 3;

/** Radius of the selection points in pixels */
export const POINT_RADIUS = 26;

/** Width of the stroke around selection points */
export const POINT_STROKE = 12;

/** Total size of the touchable area for selection points */
export const POINT_SIZE = (POINT_RADIUS + POINT_STROKE) * 2;

/** Radius of the zoom view area around points */
export const ZOOM_VIEW_RADIUS = 128;

/** Minimum distance from a point to avoid overlap */
export const MIN_DISTANCE_FROM_POINT = ZOOM_VIEW_RADIUS + POINT_SIZE;
