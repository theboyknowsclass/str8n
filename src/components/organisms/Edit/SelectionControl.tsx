import { useEditControlContext, usePanZoomContext } from '@contexts';
import { View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';
import { OverlayControl } from './Overlay/OverlayControl';
import { ImageView } from './Image/ImageView';
import { ZoomView } from './Overlay/ZoomView';
import { useImage } from '@shopify/react-native-skia';
import { usePersistedSettingsStore } from '@stores';
import { deriveSkiaTranslate } from '@utils/panZoomTransformUtils';

/**
 * Props for the SelectionControl component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 */
export type SelectionControlProps = {
  width: number;
  height: number;
};

/**
 * SelectionControl component that manages the overlay and image view for selection editing.
 *
 * This component coordinates the image view and overlay controls, synchronizing pan/zoom and selection state.
 *
 * @param props - SelectionControlProps containing width and height
 * @returns JSX element containing the selection controls
 *
 * @example
 * ```tsx
 * <SelectionControl width={400} height={300} />
 * ```
 */
export const SelectionControl: React.FC<SelectionControlProps> = ({
  width,
  height,
}) => {
  const {
    scale: panZoomScale,
    initialScale,
    translate: panZoomTranslate,
    initialTranslate,
    initialTopLeft,
  } = usePanZoomContext();

  const { showZoomView } = usePersistedSettingsStore();

  const {
    uri,
    imageSize: { width: imageWidth, height: imageHeight },
  } = useEditControlContext();

  const image = useImage(uri);

  const constants = { initialTranslate, initialTopLeft, initialScale };

  const translateX = useDerivedValue(() => {
    return deriveSkiaTranslate(
      panZoomTranslate.value,
      panZoomScale.value,
      constants
    ).x;
  });

  const translateY = useDerivedValue(() => {
    return deriveSkiaTranslate(
      panZoomTranslate.value,
      panZoomScale.value,
      constants
    ).y;
  });

  return (
    <View collapsable={false}>
      <ImageView
        width={width}
        height={height}
        image={image}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        translateX={translateX}
        translateY={translateY}
      />
      <OverlayControl
        width={width}
        height={height}
        translateX={translateX}
        translateY={translateY}
      />
      {showZoomView && <ZoomView width={width} height={height} image={image} />}
    </View>
  );
};
