import { StyleSheet, View } from 'react-native';
import { Icon, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';
import { IconType } from '@types';

interface InstructionRowProps {
  icon: IconType;
  text: string;
}

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
