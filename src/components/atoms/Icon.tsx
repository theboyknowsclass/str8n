import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import {
  IconType,
  isMaterialIcon,
  isMaterialCommunityIcon,
  isSvgIcon,
} from '@types';
import { SvgIcon } from './SvgIcon';

interface IconProps {
  name: IconType;
  size?: number;
}

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
