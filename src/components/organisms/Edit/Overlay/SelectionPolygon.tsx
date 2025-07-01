import { Points } from '@shopify/react-native-skia';
import { MovablePoint } from '@types';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

const LINE_WIDTH = 3;

/**
 * Props for the SelectionPolygon component.
 * @property points - Array of MovablePoint objects representing the polygon vertices
 * @property color - The color of the polygon lines
 * @property scaledImageHeight - Shared animated value for the scaled image height
 * @property scaledImageWidth - Shared animated value for the scaled image width
 */
type SelectionPolygonProps = {
  points: MovablePoint[];
  color: string;
  scaledImageHeight: SharedValue<number>;
  scaledImageWidth: SharedValue<number>;
};

/**
 * SelectionPolygon component that renders an animated polygon connecting selection points.
 *
 * This component uses Skia to draw lines between the selection points, forming a polygon overlay
 * on the image. The lines are animated to follow the points as they move.
 *
 * @param props - SelectionPolygonProps containing points, color, and scaling info
 * @returns JSX element containing the polygon
 *
 * @example
 * ```tsx
 * <SelectionPolygon points={points} color={'#00f'} scaledImageWidth={w} scaledImageHeight={h} />
 * ```
 */
export const SelectionPolygon: React.FC<SelectionPolygonProps> = ({
  points,
  color,
  scaledImageHeight,
  scaledImageWidth,
}) => {
  const scaledPoints = useDerivedValue(() => {
    return points.map((p) => ({
      x: p.x.value * scaledImageWidth.value,
      y: p.y.value * scaledImageHeight.value,
    }));
  }, [points, scaledImageWidth, scaledImageHeight]);

  const pathPoints = useDerivedValue(() => {
    return [
      scaledPoints.value[0],
      scaledPoints.value[1],
      scaledPoints.value[1],
      scaledPoints.value[2],
      scaledPoints.value[2],
      scaledPoints.value[3],
      scaledPoints.value[3],
      scaledPoints.value[0],
    ];
  }, [scaledPoints]);

  return (
    <Points
      points={pathPoints}
      mode="lines"
      color={color}
      style="stroke"
      strokeWidth={LINE_WIDTH}
      strokeJoin="round"
      strokeCap="round"
      opacity={0.8}
    />
  );
};
