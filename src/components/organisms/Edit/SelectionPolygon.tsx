import { Points } from '@shopify/react-native-skia';
import { MovablePoint } from '@types';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

const LINE_WIDTH = 3;

type SelectionPolygonProps = {
  points: MovablePoint[];
  color: string;
  scaledImageHeight: SharedValue<number>;
  scaledImageWidth: SharedValue<number>;
};

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
