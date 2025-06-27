import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { CloseButton } from '@molecules';
import { SafeAreaView, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';

interface ModalPageTemplateProps {
  children?: ReactNode;
  title?: string;
  onClose?: () => void;
}

export const ModalPageTemplate: React.FC<ModalPageTemplateProps> = ({
  children,
  title,
  onClose,
}) => {
  const {
    colors: { primary },
  } = useTheme();

  return (
    <SafeAreaView>
      <View style={styles.closeButtonContainer}>
        {title && (
          <Text size="larger" color={primary} style={styles.title}>
            {title}
          </Text>
        )}
        <CloseButton onPress={onClose} />
      </View>
      <View style={styles.content}>{children}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  content: {
    height: '100%',
    width: '100%',
  },
  closeButtonContainer: {
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  title: {
    flex: 1,
  },
});
