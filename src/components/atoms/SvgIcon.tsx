import MouseScrollWheel from '@assets/mouse-scroll-wheel.svg';
import { SvgIconType } from '@types';
import { Logo } from './logo';

/**
 * Props for the SvgIcon component.
 * @property name - The SVG icon name/type to display
 * @property size - Optional size of the icon in pixels (defaults to 32)
 */
interface SvgIconProps {
  name: SvgIconType;
  size?: number;
}

/**
 * SvgIcon component that renders custom SVG icons with consistent sizing.
 *
 * This component provides a unified interface for displaying custom SVG icons
 * including the mouse scroll wheel icon and transform logo. It handles the
 * appropriate SVG component based on the icon type and applies consistent sizing.
 *
 * @param props - SvgIconProps containing the SVG icon name and optional size
 * @returns JSX element containing the SVG icon or null if icon type is not supported
 *
 * @example
 * ```typescript
 * <SvgIcon name="mouse-scroll" size={24} />
 * <SvgIcon name="transform" />
 * ```
 */
export const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 32 }) => {
  switch (name) {
    case 'mouse-scroll':
      return <MouseScrollWheel width={size} height={size} />;
    case 'transform':
      return <Logo size={size} variant="icon" />;
    default:
      return null;
  }
};
