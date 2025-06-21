import MouseScrollWheel from '@assets/mouse-scroll-wheel.svg';
import { SvgIconType } from '@types';
import { LogoSvg } from './logo';

interface SvgIconProps {
  name: SvgIconType;
  size?: number;
}

export const SvgIcon: React.FC<SvgIconProps> = ({ name, size = 32 }) => {
  switch (name) {
    case 'mouse-scroll':
      return <MouseScrollWheel width={size} height={size} />;
    case 'transform':
      return <LogoSvg size={size} />;
    default:
      return null;
  }
};
