import { ImagePickerButton } from '@molecules';
import { PageTemplate } from '@templates';
import { View, StyleSheet } from 'react-native';
import { usePageModalContext, useScreenDimensions } from '@hooks';
import { Instructions } from '@components/organisms/Instructions';
import { useSessionStateStore, usePersistedSettingsStore } from '@stores';
import { useEffect } from 'react';
import { Logo } from '@atoms';

const ImportContent: React.FC = () => {
  const { width, height } = useScreenDimensions();
  const logoSize = Math.min(width, height) * 0.6;

  return (
    <View style={styles.container}>
      <Logo size={logoSize} />
      <ImagePickerButton />
    </View>
  );
};

const ModalContent: React.FC = () => {
  const { setIsModalVisible } = usePageModalContext();
  const { hasDismissedInstructions, setHasDismissedInstructions } =
    useSessionStateStore();
  const { alwaysShowInstructions } = usePersistedSettingsStore();

  useEffect(() => {
    if (alwaysShowInstructions && !hasDismissedInstructions) {
      setIsModalVisible(true);
    }
  }, [alwaysShowInstructions, hasDismissedInstructions, setIsModalVisible]);

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
