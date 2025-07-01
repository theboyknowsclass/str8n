import React from 'react';
import { Circle } from '@shopify/react-native-skia';
import { MovablePoint } from '@types';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { Crosshair } from './Crosshair';
import { POINT_RADIUS, POINT_STROKE } from './constants';

/**
 * Props for the Point component.
 * @property point - The MovablePoint object representing the point's position and state
 * @property activeColor - The color to use when the point is active
 * @property scaledImageWidth - Shared animated value for the scaled image width
 * @property scaledImageHeight - Shared animated value for the scaled image height
 */
type PointProps = {
  point: MovablePoint;
  activeColor: string;
  scaledImageWidth: SharedValue<number>;
  scaledImageHeight: SharedValue<number>;
};

/**
 * Point component that renders an animated, interactive point on the image overlay.
 *
 * This component uses Skia to render a circle representing a draggable point, with animated
 * transitions for active/inactive state, size, and color. When active, it also displays
 * a crosshair at the center for precise positioning. Used in the selection overlay.
 *
 * The point radius and stroke width are now controlled by UX constants and no longer
 * need to be passed as props.
 *
 * @param props - PointProps containing point data, styling, and scaling info
 * @returns JSX element containing the point and optional crosshair
 *
 * @example
 * ```tsx
 * <Point point={p} activeColor={'#00f'} scaledImageWidth={w} scaledImageHeight={h} />
 * ```
 */
export const Point: React.FC<PointProps> = ({
  point,
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
    return withTiming(
      point.isActive.value ? POINT_RADIUS * 1.2 : POINT_RADIUS,
      {
        duration: 100,
      }
    );
  }, [point.isActive]);

  const currentStrokeWidth = useDerivedValue(() => {
    return withTiming(
      point.isActive.value ? POINT_STROKE * 1.2 : POINT_STROKE,
      {
        duration: 100,
      }
    );
  }, [point.isActive]);

  return (
    <>
      <Circle
        cx={cx}
        cy={cy}
        r={currentRadius}
        style="stroke"
        color={color}
        strokeWidth={currentStrokeWidth}
        opacity={0.75}
      />
      <Crosshair
        cx={cx}
        cy={cy}
        isActive={point.isActive}
        activeColor={activeColor}
      />
    </>
  );
};
