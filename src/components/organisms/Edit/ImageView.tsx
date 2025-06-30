import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { CheckerBoard } from './CheckerBoard';
import { View, StyleSheet } from 'react-native';
import { useSourceImageStore } from '@stores';
import { usePanZoomContext } from '@contexts';
import { useTheme } from '@react-navigation/native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';
import { useRef } from 'react';

const BORDER_PERCENTAGE = 0.2;

type ImageViewProps = {
  width: number;
  height: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

export const ImageView: React.FC<ImageViewProps> = ({
  width,
  height,
  translateX,
  translateY,
}) => {
  const { dark } = useTheme();
  const { sourceImage } = useSourceImageStore();
  const {
    uri,
    dimensions: { width: imageWidth, height: imageHeight },
  } = sourceImage;
  const image = useImage(uri);
  const { scale: panZoomScale, translate: panZoomTranslate } =
    usePanZoomContext();

  const imageTransform = useDerivedValue(() => {
    return [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: panZoomScale.value },
    ];
  }, [panZoomScale, panZoomTranslate]);

  // store the initial pan zoom scale and translate to calculate the relative position of the selection shape
  const initialPanZoomScale = useRef(panZoomScale.value);

  const relativeScale = useDerivedValue(() => {
    return panZoomScale.value / initialPanZoomScale.current;
  });

  // Calculate minimum checkerboard size to ensure border around the image
  const minCheckerboardWidth = imageWidth * (1 + BORDER_PERCENTAGE * 2);
  const minCheckerboardHeight = imageHeight * (1 + BORDER_PERCENTAGE * 2);

  // Calculate scale factors to fit image within available content area
  const widthScale = width / imageWidth;
  const heightScale = height / imageHeight;
  // Use the smaller scale to ensure image fits completely
  const initialScale = Math.min(widthScale, heightScale);
  // Minimum scale ensures checkerboard border is always visible
  const minScale = initialScale / (1 + BORDER_PERCENTAGE * 2);

  // Calculate final checkerboard size, ensuring it's at least as large as the minimum required
  const checkerboardSize = {
    width: Math.max(minCheckerboardWidth, Math.round(width / minScale)),
    height: Math.max(minCheckerboardHeight, Math.round(height / minScale)),
  };

  // Calculate border dimensions to center the image within the checkerboard
  const borderWidth = (checkerboardSize.width - imageWidth) / 2;
  const borderHeight = (checkerboardSize.height - imageHeight) / 2;

  const backgroundTransform = useDerivedValue(() => {
    return [
      { translateX: translateX.value - borderWidth * panZoomScale.value },
      { translateY: translateY.value - borderHeight * panZoomScale.value },
      { scale: relativeScale.value },
    ];
  });

  return (
    <View style={styles.container}>
      <Canvas style={{ width, height }}>
        <Group transform={backgroundTransform}>
          <CheckerBoard
            width={checkerboardSize.width * initialPanZoomScale.current}
            height={checkerboardSize.height * initialPanZoomScale.current}
            isDarkMode={dark}
          />
        </Group>
        <Group transform={imageTransform}>
          <Image image={image} width={imageWidth} height={imageHeight} />
        </Group>
      </Canvas>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
  },
});
