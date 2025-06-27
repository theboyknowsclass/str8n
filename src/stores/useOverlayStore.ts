import { create } from 'zustand';
import { Corner, Point } from '@types';

/**
 * Overlay state interface that manages the selection overlay points and active state.
 * This state tracks the four corner points of the overlay and which point is currently active.
 * @property points - Array of four corner points defining the overlay rectangle
 * @property activePointIndex - The index of the currently active corner point
 * @property setPoints - Sets all four corner points at once
 * @property setActivePointIndex - Sets which corner point is currently active
 * @property updatePoint - Updates a specific corner point by index
 * @property resetPoints - Resets all points to their initial default positions
 */
type OverlayState = {
  points: Point[];
  activePointIndex: Corner | null;
  setPoints: (points: Point[]) => void;
  setActivePointIndex: (corner: Corner | null) => void;
  updatePoint: (corner: Corner, point: Point) => void;
  resetPoints: () => void;
};

/**
 * Default overlay points forming a centered rectangle.
 * These points are used as the initial state and for resetting the overlay.
 */
export const initialPoints: Point[] = [
  { x: 0.25, y: 0.25 }, // Top-left
  { x: 0.75, y: 0.25 }, // Top-right
  { x: 0.75, y: 0.75 }, // Bottom-right
  { x: 0.25, y: 0.75 }, // Bottom-left
];

/**
 * Zustand store for managing overlay selection state.
 *
 * This store handles the state of the image selection overlay including
 * the four corner points that define the selection area and which point
 * is currently being manipulated by the user.
 *
 * @example
 * ```typescript
 * const {
 *   points,
 *   activePointIndex,
 *   setPoints,
 *   setActivePointIndex,
 *   updatePoint,
 *   resetPoints
 * } = useOverlayStore();
 *
 * // Update a specific corner point
 * updatePoint(Corner.TOP_LEFT, { x: 0.2, y: 0.2 });
 *
 * // Set which point is active
 * setActivePointIndex(Corner.TOP_RIGHT);
 *
 * // Reset to default positions
 * resetPoints();
 *
 * // Set all points at once
 * setPoints([
 *   { x: 0.1, y: 0.1 }, // Top-left
 *   { x: 0.9, y: 0.1 }, // Top-right
 *   { x: 0.9, y: 0.9 }, // Bottom-right
 *   { x: 0.1, y: 0.9 }, // Bottom-left
 * ]);
 * ```
 */
export const useOverlayStore = create<OverlayState>()((set) => ({
  points: initialPoints,
  activePointIndex: null,
  setPoints: (points: Point[]) => set({ points }),
  setActivePointIndex: (corner: Corner | number | null) =>
    set({ activePointIndex: corner }),
  updatePoint: (corner: Corner, point: Point) =>
    set((state) => {
      const newPoints = [...state.points];
      newPoints[corner] = point;
      return { points: newPoints };
    }),
  resetPoints: () => set({ points: initialPoints }),
}));
