import MouseScrollWheel from '@assets/mouse-scroll-wheel.svg';
import { SvgIconType } from '@types';

interface SvgIconProps {
  name: SvgIconType;
  size?: number;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 32 }) => {
  switch (name) {
    case 'mouse-scroll':
      return <MouseScrollWheel width={size} height={size} />;
    default:
      return null;
  }
};
