import { StyleSheet, View } from 'react-native';
import { Icon, Text } from '@atoms';
import { useTheme } from 'expo-router/react-navigation';
import { IconType } from '@types';

/**
 * Props for the InstructionRow component.
 * @property icon - The icon to display alongside the instruction text
 * @property text - The instruction text to display
 */
interface InstructionRowProps {
  icon: IconType;
  text: string;
}

/**
 * InstructionRow component that displays a single instruction with an icon.
 *
 * This component renders a horizontal row containing an icon and text for
 * a single instruction. The icon is displayed in a circular container with
 * a border, and the text is styled with the theme's primary color.
 *
 * @param props - InstructionRowProps containing the icon and text
 * @returns JSX element containing the instruction row
 *
 * @example
 * ```typescript
 * <InstructionRow icon="gesture-tap-hold" text="Tap and hold to move" />
 * ```
 */
export const InstructionRow: React.FC<InstructionRowProps> = ({
  icon,
  text,
}) => {
  const { colors } = useTheme();

  const iconStyle = {
    borderColor: colors.primary,
  };

  return (
    <View style={styles.contentRow}>
      <View style={[styles.iconContainer, iconStyle]}>
        <Icon name={icon} size={36} />
      </View>
      <Text
        size="medium"
        color={colors.primary}
        style={{ flexShrink: 1, textAlign: 'left' }}
      >
        {text}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    borderRadius: 9999,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderWidth: 2,
  },
});
