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
                <SelectionPoints />
              </ImageBackground>
            </CheckerBoardBackground>
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
