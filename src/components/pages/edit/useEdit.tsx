import { useOverlayStore, useSourceImageStore } from '@stores';
import { makeMutable } from 'react-native-reanimated';
import { Dimensions, MovablePoint } from '@types';

export interface UseEdit {
  uri: string | null;
  dimensions: Dimensions;
  movablePoints: MovablePoint[];
}

export const useEdit = (): UseEdit => {
  const {
    sourceImage: { uri, dimensions },
  } = useSourceImageStore();

  const points = useOverlayStore((state) => state.points);
  // create mutable points for smooth animations
  const movablePoints = points.map(
    (p) =>
      ({
        x: makeMutable(p.x),
        y: makeMutable(p.y),
        isActive: makeMutable(false),
        absoluteX: makeMutable(0),
        absoluteY: makeMutable(0),
      }) as MovablePoint
  );

  return {
    uri,
    dimensions,
    movablePoints,
  };
};
