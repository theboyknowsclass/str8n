import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CloseButton } from '@molecules';

interface ModalPageTemplateProps {
  children?: ReactNode;
  onClose?: () => void;
}

export const ModalPageTemplate: React.FC<ModalPageTemplateProps> = ({
  children,
  onClose,
}) => {
  const insets = useSafeAreaInsets();
  console.log('insets', insets);
  return (
    <View style={[styles.container, { 
      paddingTop: Math.max(insets.top, 16), 
      paddingBottom: Math.max(insets.bottom, 16), 
      paddingLeft: Math.max(insets.left, 16), 
      paddingRight: Math.max(insets.right, 16) 
    }]}>
      <View style={[styles.closeButtonContainer]}>
        <CloseButton onPress={onClose} />
      </View>
      <View style={[styles.content]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    width: '100%',
  },
  closeButtonContainer: {
    zIndex: 1000,
  },
}); 