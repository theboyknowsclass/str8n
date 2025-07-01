import { Line } from '@shopify/react-native-skia';
import React from 'react';
import {
  SharedValue,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import { POINT_RADIUS } from './constants';

/**
 * Props for the Crosshair component.
 * @property cx - Shared animated value for the x-coordinate of the crosshair center
 * @property cy - Shared animated value for the y-coordinate of the crosshair center
 * @property isActive - Shared animated value indicating whether the crosshair should be visible
 * @property activeColor - The color to use for the crosshair lines
 */
type CrosshairProps = {
  cx: SharedValue<number>;
  cy: SharedValue<number>;
  isActive: SharedValue<boolean>;
  activeColor: string;
};

/**
 * Crosshair component that renders animated horizontal and vertical lines at the center of a point.
 *
 * This component creates a crosshair (intersecting horizontal and vertical lines) that appears
 * when a point is active. The crosshair animates in/out with smooth timing and scales based
 * on the point's radius. Used to provide precise visual alignment for active points.
 *
 * The crosshair radius is now controlled by UX constants and no longer needs to be passed as a prop.
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
 *   activeColor="#00f"
 * />
 * ```
 */
export const Crosshair: React.FC<CrosshairProps> = ({
  cx,
  cy,
  isActive,
  activeColor,
}) => {
  const crosshairRadius = useDerivedValue(() => {
    return withTiming(isActive.value ? POINT_RADIUS * 0.4 : 0, {
      duration: 100,
    });
  }, [isActive]);

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
