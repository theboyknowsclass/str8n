import { ImagePickerButton } from '@molecules';
import { PageTemplate } from '@templates';
import { View, StyleSheet } from 'react-native';
import { usePageModalContext, useScreenDimensions } from '@hooks';
import { Instructions } from '@components/organisms/Instructions';
import { useSessionStateStore } from '@stores';
import { Logo, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';
import { useAutoShowInstructions } from '@hooks/useAutoShowInstructions';

const ImportContent: React.FC = () => {
  const { colors } = useTheme();
  const { width, height } = useScreenDimensions();
  const logoSize = Math.min(width, height) * 0.7;

  // useAutoShowInstructions();

  return (
    <View style={styles.container}>
      <Logo size={logoSize} />
      <Text size="larger" color={colors.primary}>
        correct your perspective
      </Text>
    </View>
  );
};

const ModalContent: React.FC = () => {
  const { setIsModalVisible } = usePageModalContext();
  const { setHasDismissedInstructions } = useSessionStateStore();

  useAutoShowInstructions();

  const onClosePress = () => {
    setIsModalVisible(false);
    setHasDismissedInstructions(true);
  };

  return <Instructions mode="import" onClosePress={onClosePress} />;
};

export const Import: React.FC = () => {
  return (
    <PageTemplate>
      <PageTemplate.ModalContent>
        <ModalContent />
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
