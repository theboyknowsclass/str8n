import { ImagePickerButton } from '@molecules';
import { PageTemplate } from '@templates';
import { View, StyleSheet } from 'react-native';
import { useScreenDimensions } from '@hooks';
import { InstructionsModal } from '@organisms';
import { InstructionMode } from '@types';
import { Logo, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';

const ImportContent: React.FC = () => {
  const { colors } = useTheme();
  const { width, height } = useScreenDimensions();
  const logoSize = Math.min(width, height) * 0.7;

  // useAutoShowInstructions();

  return (
    <View style={styles.container}>
      <Logo size={logoSize} variant="logo" />
      <Text size="larger" color={colors.primary}>
        correct your perspective
      </Text>
    </View>
  );
};

export const Import: React.FC = () => {
  return (
    <PageTemplate>
      <PageTemplate.ModalContent>
        <InstructionsModal mode={InstructionMode.ALL} />
      </PageTemplate.ModalContent>
      <PageTemplate.ActionItems>
        <ImagePickerButton />
      </PageTemplate.ActionItems>
      <ImportContent />
    </PageTemplate>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
