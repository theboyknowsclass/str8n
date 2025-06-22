import { CheckerBoardBackground, TransformImageButton } from '@molecules';
import { View, StyleSheet, ImageBackground } from 'react-native';
import { PageTemplate } from '@templates';
import { usePageTemplateContext } from '@hooks';
import { useSourceImageStore } from '@stores';
import {
  InstructionsModal,
  PanZoomControl,
  SelectionOverlay,
} from '@organisms';
import { InstructionMode } from '@types';

const BORDER_PERCENTAGE = 0.2;
const MAX_SCALE = 1;

const EditContent: React.FC = () => {
  const { sourceImage } = useSourceImageStore();
  const { dimensions: contentDimensions, isReady } = usePageTemplateContext();

  if (!isReady || !sourceImage) {
    return null;
  }

  const { uri, dimensions: originalDimensions } = sourceImage;

  const minCheckerboardWidth =
    originalDimensions.width * (1 + BORDER_PERCENTAGE * 2);
  const minCheckerboardHeight =
    originalDimensions.height * (1 + BORDER_PERCENTAGE * 2);

  const imageDimensions = {
    width: originalDimensions.width,
    height: originalDimensions.height,
  };

  const widthScale = contentDimensions.width / imageDimensions.width;
  const heightScale = contentDimensions.height / imageDimensions.height;
  const initialScale = Math.min(widthScale, heightScale);
  const minScale = initialScale / (1 + BORDER_PERCENTAGE * 2);

  const checkerboardSize = {
    width: Math.max(
      minCheckerboardWidth,
      Math.round(contentDimensions.width / minScale)
    ),
    height: Math.max(
      minCheckerboardHeight,
      Math.round(contentDimensions.height / minScale)
    ),
  };

  const absoluteWindowSize = {
    width: contentDimensions.width / initialScale,
    height: contentDimensions.height / initialScale,
  };

  const borderWidth = (checkerboardSize.width - imageDimensions.width) / 2;
  const borderHeight = (checkerboardSize.height - imageDimensions.height) / 2;

  const offsetX = (absoluteWindowSize.width - imageDimensions.width) / 2;
  const offsetY = (absoluteWindowSize.height - imageDimensions.height) / 2;
  const initialTranlate = {
    x: -borderWidth + offsetX,
    y: -borderHeight + offsetY,
  };

  return (
    <View style={styles.container}>
      <PanZoomControl
        contentSize={checkerboardSize}
        controlSize={contentDimensions}
        initialScale={initialScale}
        minScale={minScale}
        maxScale={MAX_SCALE}
        initialTranslate={initialTranlate}
      >
        <CheckerBoardBackground
          width={checkerboardSize.width}
          height={checkerboardSize.height}
        >
          <ImageBackground
            source={{ uri: uri ?? undefined }}
            style={[
              {
                position: 'absolute',
                top: borderHeight,
                left: borderWidth,
                width: imageDimensions.width,
                height: imageDimensions.height,
              },
            ]}
          >
            <SelectionOverlay />
          </ImageBackground>
        </CheckerBoardBackground>
      </PanZoomControl>
    </View>
  );
};
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
  overlayWrapper: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
