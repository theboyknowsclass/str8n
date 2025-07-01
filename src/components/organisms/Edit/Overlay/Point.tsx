import { Circle } from '@shopify/react-native-skia';
import { MovablePoint } from '@types';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

type PointProps = {
  point: MovablePoint;
  strokeWidth: number;
  radius: number;
  activeColor: string;
  scaledImageWidth: SharedValue<number>;
  scaledImageHeight: SharedValue<number>;
};

export const Point: React.FC<PointProps> = ({
  point,
  strokeWidth,
  radius,
  activeColor,
  scaledImageWidth,
  scaledImageHeight,
}) => {
  const cx = useDerivedValue(() => {
    return point.x.value * scaledImageWidth.value;
  }, [point, scaledImageWidth]);
  const cy = useDerivedValue(() => {
    return point.y.value * scaledImageHeight.value;
  }, [point, scaledImageHeight]);

  const color = useDerivedValue(() => {
    return point.isActive.value ? activeColor : 'rgba(255, 255, 255, 0.7)';
  }, [point.isActive, activeColor]);

  const currentRadius = useDerivedValue(() => {
    return withTiming(point.isActive.value ? radius * 1.2 : radius, {
      duration: 100,
    });
  }, [radius, point.isActive]);

  const currentStrokeWidth = useDerivedValue(() => {
    return withTiming(point.isActive.value ? strokeWidth * 1.2 : strokeWidth, {
      duration: 100,
    });
  }, [strokeWidth, point.isActive]);

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={currentRadius}
      style="stroke"
      color={color}
      strokeWidth={currentStrokeWidth}
      opacity={0.75}
    />
  );
};
