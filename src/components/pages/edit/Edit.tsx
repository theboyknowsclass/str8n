import { TransformImageButton } from '@molecules';
import { View, StyleSheet } from 'react-native';
import { PageTemplate } from '@templates';
import { InstructionsModal, EditControl } from '@organisms';
import { InstructionMode } from '@types';
import { usePageTemplateContext } from '@contexts';
import { EditControlContextProvider } from '@contexts/EditControlContext';
import { useEdit } from './useEdit';

/**
 * Content component for the edit page.
 *
 * Renders the interactive image editing interface with pan/zoom controls,
 * selection overlay, and checkerboard background. Manages the complex
 * layout of image, overlay points, and selection shape.
 *
 * @returns JSX element containing the editing interface
 * @returns null if the page template is not ready
 *
 * @example
 * ```typescript
 * <EditContent />
 * ```
 */
const EditContent: React.FC = () => {
  const {
    contentDimensions: { width, height },
    isReady,
  } = usePageTemplateContext();

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <EditControl width={width} height={height} />
    </View>
  );
};

/**
 * Edit page component that provides the main image editing interface.
 *
 * This component allows users to manipulate the selection overlay points
 * on the source image. It includes pan/zoom functionality, visual feedback
 * with selection shapes, and a transform button to process the image.
 *
 * @returns JSX element containing the edit page layout
 *
 * @example
 * ```typescript
 * <Edit />
 * ```
 */
export const Edit: React.FC = () => {
  const { uri, dimensions, movablePoints } = useEdit();

  return (
    <EditControlContextProvider
      uri={uri}
      imageSize={dimensions}
      selectionPoints={movablePoints}
    >
      <PageTemplate>
        <PageTemplate.ModalContent>
          <InstructionsModal mode={InstructionMode.EDIT} />
        </PageTemplate.ModalContent>
        <PageTemplate.ActionItems>
          <TransformImageButton />
        </PageTemplate.ActionItems>
        <EditContent />
      </PageTemplate>
    </EditControlContextProvider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    backgroundColor: 'transparent',
    borderRadius: 5,
  },
});
