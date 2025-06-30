import { Circle } from '@shopify/react-native-skia';
import { MovablePoint } from '@types';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

type SelectionPointVisualProps = {
  absolutePoint: MovablePoint;
  pointSize: SharedValue<number>;
  pointStroke: SharedValue<number>;
  activeColor: string;
  imageWidth: number;
  imageHeight: number;
  canvasDimensions: { width: number; height: number };
};

export const SelectionPointVisual: React.FC<SelectionPointVisualProps> = ({
  absolutePoint,
  pointSize,
  pointStroke,
  activeColor,
  imageWidth,
  imageHeight,
  canvasDimensions,
}) => {
  const cx = useDerivedValue(() => {
    return (absolutePoint.x.value / imageWidth) * canvasDimensions.width;
  }, [absolutePoint.x, imageWidth, canvasDimensions]);
  const cy = useDerivedValue(() => {
    return (absolutePoint.y.value / imageHeight) * canvasDimensions.height;
  }, [absolutePoint.y, imageHeight, canvasDimensions]);

  const color = useDerivedValue(() => {
    return absolutePoint.isActive.value
      ? activeColor
      : 'rgba(255, 255, 255, 0.5)';
  }, [absolutePoint.isActive, activeColor]);

  const radius = useDerivedValue(() => {
    return withTiming(
      absolutePoint.isActive.value ? pointSize.value * 1.2 : pointSize.value,
      { duration: 100 }
    );
  }, [pointSize, absolutePoint.isActive]);

  const strokeWidth = useDerivedValue(() => {
    return withTiming(
      absolutePoint.isActive.value
        ? pointStroke.value * 1.2
        : pointStroke.value,
      { duration: 100 }
    );
  }, [pointStroke, absolutePoint.isActive]);

  return (
    <Circle
      cx={cx}
      cy={cy}
      r={radius}
      style="stroke"
      color={color}
      strokeWidth={strokeWidth}
      opacity={0.5}
    />
  );
};
