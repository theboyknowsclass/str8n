import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import {
  IconType,
  isMaterialIcon,
  isMaterialCommunityIcon,
  isSvgIcon,
} from '@types';
import { SvgIcon } from './SvgIcon';

/**
 * Props for the Icon component.
 * @property name - The icon name/type to display
 * @property size - Optional size of the icon in pixels (defaults to 32)
 */
interface IconProps {
  name: IconType;
  size?: number;
}

/**
 * Icon component that renders different types of icons with consistent theming.
 *
 * This component acts as a unified interface for displaying icons from different
 * sources including Material Icons, Material Community Icons, and custom SVG icons.
 * It automatically applies theme colors and handles the appropriate icon library
 * based on the icon type.
 *
 * @param props - IconProps containing the icon name and optional size
 * @returns JSX element containing the themed icon or null if icon type is not supported
 *
 * @example
 * ```typescript
 * <Icon name="settings" size={24} />
 * <Icon name="camera" />
 * ```
 */
export const Icon: React.FC<IconProps> = ({ name, size = 32 }) => {
  const { colors } = useTheme();

  if (isMaterialIcon(name)) {
    return <MaterialIcons name={name} size={size} color={colors.primary} />;
  }

  if (isMaterialCommunityIcon(name)) {
    return (
      <MaterialCommunityIcons name={name} size={size} color={colors.primary} />
    );
  }

  if (isSvgIcon(name)) {
    return <SvgIcon name={name} size={size} />;
  }

  return null;
};
