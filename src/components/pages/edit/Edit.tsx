import { CheckerBoardBackground, TransformImageButton } from '@molecules';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { PageTemplate } from '@templates';
import { usePageTemplateContext, useEdit } from '@hooks';
import {
  InstructionsModal,
  PanZoomControl,
  SelectionPoints,
  SelectionShape,
} from '@organisms';
import { InstructionMode } from '@types';
import { PanZoomProvider } from '@contexts/PanZoomContext';
import { EditProvider } from '@contexts';

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
    uri,
    imageDimensions,
    checkerboardSize,
    initialScale,
    minScale,
    maxScale,
    initialTranslate,
    borderWidth,
    borderHeight,
  } = useEdit(contentDimensions);

  if (!isReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <EditProvider>
        <PanZoomProvider
          initialScale={initialScale}
          initialTranslate={initialTranslate}
        >
          <PanZoomControl
            contentSize={checkerboardSize}
            controlSize={contentDimensions}
            minScale={minScale}
            maxScale={maxScale}
          >
            <SelectionPoints />
          </PanZoomControl>
          <SelectionShape
            width={contentDimensions.width}
            height={contentDimensions.height}
          />
        </PanZoomProvider>
      </EditProvider>
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
    <PageTemplate>
      <PageTemplate.ModalContent>
        <InstructionsModal mode={InstructionMode.EDIT} />
      </PageTemplate.ModalContent>
      <PageTemplate.ActionItems>
        <TransformImageButton />
      </PageTemplate.ActionItems>
      <EditContent />
    </PageTemplate>
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
  checkerboard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});
