import { TransformImageButton } from '@molecules';
import { View, StyleSheet } from 'react-native';
import { PageTemplate } from '@templates';
import { useEdit } from '@hooks';
import {
  InstructionsModal,
  PanZoomGestureHandler,
  SelectionControl,
} from '@organisms';
import { InstructionMode } from '@types';
import { PanZoomContextProvider } from '@contexts/PanZoomContext';
import { SelectionProvider } from '@contexts/SelectionContext';
import { usePageTemplateContext } from '@contexts';

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
  const { dimensions: contentDimensions, isReady } = usePageTemplateContext();
  const {
    checkerboardSize,
    initialScale,
    minScale,
    maxScale,
    initialTranslate,
  } = useEdit(contentDimensions);

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <PanZoomContextProvider
        initialScale={initialScale}
        initialTranslate={initialTranslate}
      >
        <PanZoomGestureHandler
          contentSize={checkerboardSize}
          width={contentDimensions.width}
          height={contentDimensions.height}
          minScale={minScale}
          maxScale={maxScale}
        >
          <SelectionControl
            width={contentDimensions.width}
            height={contentDimensions.height}
          />
        </PanZoomGestureHandler>
      </PanZoomContextProvider>
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
  return (
    <SelectionProvider>
      <PageTemplate>
        <PageTemplate.ModalContent>
          <InstructionsModal mode={InstructionMode.EDIT} />
        </PageTemplate.ModalContent>
        <PageTemplate.ActionItems>
          <TransformImageButton />
        </PageTemplate.ActionItems>
        <EditContent />
      </PageTemplate>
    </SelectionProvider>
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
