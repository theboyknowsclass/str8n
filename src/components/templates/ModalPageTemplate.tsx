import React, { ReactNode } from 'react';
import { View, StyleSheet } from 'react-native';
import { CloseButton } from '@molecules';
import { SafeAreaView, Text } from '@atoms';
import { useTheme } from 'expo-router/react-navigation';

/**
 * Props for the ModalPageTemplate component.
 * @property children - React nodes to be rendered in the modal content area
 * @property title - Optional title text to display in the modal header
 * @property onClose - Optional callback function called when the close button is pressed
 */
interface ModalPageTemplateProps {
  children?: ReactNode;
  title?: string;
  onClose?: () => void;
}

/**
 * ModalPageTemplate component that provides a consistent modal page layout.
 *
 * This component provides a standardized layout for modal pages with a header
 * containing an optional title and close button, plus a content area. It uses
 * SafeAreaView for proper spacing and theme colors for consistent styling.
 *
 * @param props - ModalPageTemplateProps containing children, title, and onClose
 * @returns JSX element containing the modal page template
 *
 * @example
 * ```typescript
 * <ModalPageTemplate title="Settings" onClose={handleClose}>
 *   <SettingsContent />
 * </ModalPageTemplate>
 * ```
 */
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
