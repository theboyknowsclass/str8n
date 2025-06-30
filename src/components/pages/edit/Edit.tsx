import { TransformImageButton } from '@molecules';
import { View, StyleSheet } from 'react-native';
import { PageTemplate } from '@templates';
import {
  InstructionsModal,
  PanZoomGestureHandler,
  SelectionControl,
} from '@organisms';
import { InstructionMode, MovablePoint } from '@types';
import { PanZoomContextProvider } from '@contexts/PanZoomContext';
import { usePageTemplateContext } from '@contexts';
import { useOverlayStore, useSourceImageStore } from '@stores';
import { makeMutable } from 'react-native-reanimated';
import { getEditControlParams } from '@utils/editControlUtils';

interface EditContentProps {
  points: MovablePoint[];
}

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
const EditContent: React.FC<EditContentProps> = ({ points }) => {
  const {
    dimensions: { width, height },
    isReady,
  } = usePageTemplateContext();

  const { sourceImage } = useSourceImageStore();
  const {
    dimensions: { width: imageWidth, height: imageHeight },
  } = sourceImage;

  const {
    checkerboardSize,
    initialScale,
    minScale,
    maxScale,
    initialTranslate,
  } = getEditControlParams(width, height, imageWidth, imageHeight);

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
          width={width}
          height={height}
          minScale={minScale}
          maxScale={maxScale}
        >
          <SelectionControl
            width={width}
            height={height}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            points={points}
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
  const points = useOverlayStore((state) => state.points);

  // create mutable points for smooth animations
  const movablePoints = points.map(
    (p) =>
      ({
        x: makeMutable(p.x),
        y: makeMutable(p.y),
        isActive: makeMutable(false),
      }) as MovablePoint
  );

  return (
    <PageTemplate>
      <PageTemplate.ModalContent>
        <InstructionsModal mode={InstructionMode.EDIT} />
      </PageTemplate.ModalContent>
      <PageTemplate.ActionItems>
        <TransformImageButton />
      </PageTemplate.ActionItems>
      <EditContent points={movablePoints} />
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
});
