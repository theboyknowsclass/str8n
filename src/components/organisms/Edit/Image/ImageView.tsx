import { Canvas, Group, Image, useImage } from '@shopify/react-native-skia';
import { CheckerBoard } from './CheckerBoard';
import { View, StyleSheet } from 'react-native';
import { useSourceImageStore } from '@stores';
import { usePanZoomContext } from '@contexts';
import { useTheme } from '@react-navigation/native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

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
  const { scale, initialScale, contentSize, relativeScale } =
    usePanZoomContext();

  const imageTransform = useDerivedValue(() => {
    return [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ];
  }, [translateX, translateY, scale]);

  const backgroundTransform = useDerivedValue(() => {
    // Calculate border dimensions to make the checkerboard fill the zoomed out control area
    const borderWidth = (contentSize.width - imageWidth) / 2;
    const borderHeight = (contentSize.height - imageHeight) / 2;

    return [
      { translateX: translateX.value - borderWidth * scale.value },
      { translateY: translateY.value - borderHeight * scale.value },
      { scale: relativeScale.value },
    ];
  });

  return (
    <View style={styles.container} collapsable={false}>
      <Canvas style={{ width, height }}>
        <Group transform={backgroundTransform}>
          <CheckerBoard
            width={contentSize.width * initialScale}
            height={contentSize.height * initialScale}
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
