import { Line } from '@shopify/react-native-skia';
import React from 'react';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

/**
 * Props for the Crosshair component.
 * @property cx - Shared animated value for the x-coordinate of the crosshair center
 * @property cy - Shared animated value for the y-coordinate of the crosshair center
 * @property isActive - Shared animated value indicating whether the crosshair should be visible
 * @property radius - The radius of the associated point, used to scale the crosshair size
 * @property activeColor - The color to use for the crosshair lines
 */
type CrosshairProps = {
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  isActive: SharedValue<boolean>;
  radius: number;
  activeColor: string;
};

/**
 * Crosshair component that renders animated horizontal and vertical lines at the center of a point.
 *
 * This component creates a crosshair (intersecting horizontal and vertical lines) that appears
 * when a point is active. The crosshair animates in/out with smooth timing and scales based
 * on the point's radius. Used to provide precise visual alignment for active points.
 *
 * @param props - CrosshairProps containing position, state, and styling information
 * @returns JSX element containing the animated crosshair lines
 *
 * @example
 * ```tsx
 * <Crosshair
 *   cx={pointX}
 *   cy={pointY}
 *   isActive={isActive}
 *   radius={20}
 *   activeColor="#00f"
 * />
 * ```
 */
export const Crosshair: React.FC<CrosshairProps> = ({
  cx,
  cy,
  isActive,
  radius,
  activeColor,
}) => {
  const crosshairRadius = useDerivedValue(() => {
    return withTiming(isActive.value ? radius * 0.4 : 0, {
      duration: 100,
    });
  }, [radius, isActive]);

  const crossHairVerticalPoint1 = useDerivedValue(() => {
    return { x: cx.value - crosshairRadius.value, y: cy.value };
  }, [cx, cy, crosshairRadius]);
  const crossHairVerticalPoint2 = useDerivedValue(() => {
    return { x: cx.value + crosshairRadius.value, y: cy.value };
  }, [cx, cy, crosshairRadius]);
  const crossHairHorizontalPoint1 = useDerivedValue(() => {
    return { x: cx.value, y: cy.value - crosshairRadius.value };
  }, [cx, cy, crosshairRadius]);
  const crossHairHorizontalPoint2 = useDerivedValue(() => {
    return { x: cx.value, y: cy.value + crosshairRadius.value };
  }, [cx, cy, crosshairRadius]);
  const crossHairOpacity = useDerivedValue(() => {
    return withTiming(isActive.value ? 0.7 : 0, {
      duration: 100,
    });
  }, [isActive]);

  return (
    <>
      <Line
        p1={crossHairVerticalPoint1}
        p2={crossHairVerticalPoint2}
        color={activeColor}
        strokeWidth={2}
        opacity={crossHairOpacity}
      />
      <Line
        p1={crossHairHorizontalPoint1}
        p2={crossHairHorizontalPoint2}
        color={activeColor}
        strokeWidth={2}
        opacity={crossHairOpacity}
      />
    </>
  );
};
