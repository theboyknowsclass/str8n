import { useOverlayStore, useSourceImageStore } from '@stores';
import { makeMutable } from 'react-native-reanimated';
import { useEffect, useRef } from 'react';
import { Dimensions, MovablePoint, Point } from '@types';

export interface UseEdit {
  uri: string | null;
  dimensions: Dimensions;
  movablePoints: MovablePoint[];
}

const createMovablePoints = (points: Point[]): MovablePoint[] =>
  points.map(
    (p) =>
      ({
        x: makeMutable(p.x),
        y: makeMutable(p.y),
        isActive: makeMutable(false),
        absoluteX: makeMutable(0),
        absoluteY: makeMutable(0),
      }) as MovablePoint
  );

export const useEdit = (): UseEdit => {
  const {
    sourceImage: { uri, dimensions },
  } = useSourceImageStore();

  const points = useOverlayStore((state) => state.points);
  const movablePointsRef = useRef<MovablePoint[] | null>(null);

  // Only create fresh shared values on first mount, or if the point count
  // itself changes (not expected today - every points array is always
  // exactly 4 - but kept as a safe fallback for e.g. a future multi-point
  // tier). Otherwise, reuse the same MovablePoint objects across renders.
  if (
    !movablePointsRef.current ||
    movablePointsRef.current.length !== points.length
  ) {
    movablePointsRef.current = createMovablePoints(points);
  }

  useEffect(() => {
    const movablePoints = movablePointsRef.current;
    if (!movablePoints || movablePoints.length !== points.length) {
      return;
    }

    // Sync the existing shared values' positions in place rather than
    // replacing the MovablePoint objects themselves. Dragging a point never
    // goes through this store at all (PointGestureHandler mutates point.x/y
    // directly on the UI thread) - the only thing that reaches here is a
    // bulk replacement like auto-detect's result, which (unlike every other
    // caller of setPoints) can fire while the Edit screen is already
    // mounted and its gesture handlers are already bound to these exact
    // shared value objects. Recreating them out from under a live,
    // already-bound overlay was producing a silent Skia rendering failure
    // (the canvas going blank) - updating values in place keeps the same
    // objects alive throughout, which is the same safe pattern dragging
    // already relies on.
    points.forEach((p, i) => {
      movablePoints[i].x.value = p.x;
      movablePoints[i].y.value = p.y;
    });
    // Only re-sync when the points array itself changes identity (e.g.
    // auto-detect or a fresh pick) - not on every unrelated re-render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  return {
    uri,
    dimensions,
    movablePoints: movablePointsRef.current,
  };
};
