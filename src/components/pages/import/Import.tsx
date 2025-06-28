import { ImagePickerButton } from '@molecules';
import { PageTemplate } from '@templates';
import { View, StyleSheet } from 'react-native';
import { useScreenDimensions } from '@hooks';
import { InstructionsModal } from '@organisms';
import { InstructionMode } from '@types';
import { Logo, Text } from '@atoms';
import { useTheme } from '@react-navigation/native';

/**
 * Content component for the import page.
 *
 * Displays the app logo and tagline in a centered layout.
 * The logo size is responsive based on screen dimensions.
 *
 * @returns JSX element containing the centered logo and text
 *
 * @example
 * ```typescript
 * <ImportContent />
 * ```
 */
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

/**
 * Import page component that serves as the app's landing page.
 *
 * This component displays the app logo, tagline, and provides an image picker
 * button for users to select images for processing. It includes instruction
 * modal support and uses the page template for consistent layout.
 *
 * @returns JSX element containing the import page layout
 *
 * @example
 * ```typescript
 * <Import />
 * ```
 */
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
