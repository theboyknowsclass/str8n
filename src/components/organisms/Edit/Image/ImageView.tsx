import { Canvas, Group, Image, SkImage } from '@shopify/react-native-skia';
import { CheckerBoard } from './CheckerBoard';
import { View, StyleSheet } from 'react-native';
import { usePanZoomContext } from '@contexts';
import { useTheme } from '@react-navigation/native';
import { SharedValue, useDerivedValue } from 'react-native-reanimated';

/**
 * Props for the ImageView component.
 * @property width - The width of the view in pixels
 * @property height - The height of the view in pixels
 * @property translateX - Shared animated value for X translation
 * @property translateY - Shared animated value for Y translation
 */
type ImageViewProps = {
  width: number;
  height: number;
  image: SkImage | null;
  imageWidth: number;
  imageHeight: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

/**
 * ImageView component that renders the source image and checkerboard background with pan/zoom support.
 *
 * This component uses Skia to render the image and a checkerboard background, applying animated transforms
 * for panning and zooming. It is used as the main image display in the editing interface.
 *
 * @param props - ImageViewProps containing width, height, translateX, and translateY
 * @returns JSX element containing the image and background
 *
 * @example
 * ```tsx
 * <ImageView width={400} height={300} translateX={x} translateY={y} />
 * ```
 */
export const ImageView: React.FC<ImageViewProps> = ({
  width,
  height,
  image,
  imageWidth,
  imageHeight,
  translateX,
  translateY,
}) => {
  const { dark } = useTheme();

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
