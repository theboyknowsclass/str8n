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
  pointRadius: number;
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
  pointRadius,
}) => {
  const scaledPoints = useDerivedValue(() => {
    return points.map((p) => ({
      x: p.x.value * scaledImageWidth.value,
      y: p.y.value * scaledImageHeight.value,
      isActive: p.isActive,
    }));
  }, [points, scaledImageWidth, scaledImageHeight]);

  const linePoints = useDerivedValue(() => {
    const getLinePoints = (point1Index: number, point2Index: number) => {
      let p1 = scaledPoints.value[point1Index];
      let p2 = scaledPoints.value[point2Index];

      if (p1.isActive.value) {
        // move p1 by the scaled point size along the line
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const newX = p1.x + pointRadius * Math.cos(angle);
        const newY = p1.y + pointRadius * Math.sin(angle);

        p1 = {
          x: newX,
          y: newY,
          isActive: p1.isActive,
        };
      }

      if (p2.isActive.value) {
        // move p1 by the scaled point size along the line
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const newX = p2.x - pointRadius * Math.cos(angle);
        const newY = p2.y - pointRadius * Math.sin(angle);

        p2 = {
          x: newX,
          y: newY,
          isActive: p2.isActive,
        };
      }

      return [p1, p2];
    };

    return getLinePoints(0, 1)
      .concat(getLinePoints(1, 2))
      .concat(getLinePoints(2, 3))
      .concat(getLinePoints(3, 0));
  }, [scaledPoints]);

  const pathPoints = useDerivedValue(() => {
    return [
      linePoints.value[0],
      linePoints.value[1],
      linePoints.value[2],
      linePoints.value[3],
      linePoints.value[4],
      linePoints.value[5],
      linePoints.value[6],
      linePoints.value[7],
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
