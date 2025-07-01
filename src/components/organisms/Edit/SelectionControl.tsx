import { useEditControlContext, usePanZoomContext } from '@contexts';
import { View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';
import { OverlayControl } from './Overlay/OverlayControl';
import { ImageView } from './Image/ImageView';

export type SelectionControlProps = {
  width: number;
  height: number;
};

export const SelectionControl: React.FC<SelectionControlProps> = ({
  width,
  height,
}) => {
  const {
    scale: panZoomScale,
    initialScale,
    translate: panZoomTranslate,
    initialTranslate,
    relativeScale,
  } = usePanZoomContext();

  const {
    imageSize: { width: imageWidth, height: imageHeight },
  } = useEditControlContext();

  const initialScaledImageDimensions = {
    width: imageWidth * initialScale,
    height: imageHeight * initialScale,
  };

  const initialTopLeft = {
    x: (initialScaledImageDimensions.width - width) / 2,
    y: (initialScaledImageDimensions.height - height) / 2,
  };

  const translateX = useDerivedValue(() => {
    const xDiff = panZoomTranslate.value.x - initialTranslate.x;
    const translateX =
      xDiff * panZoomScale.value - initialTopLeft.x * relativeScale.value;
    return translateX;
  });

  const translateY = useDerivedValue(() => {
    const yDiff = panZoomTranslate.value.y - initialTranslate.y;
    const translateY =
      yDiff * panZoomScale.value - initialTopLeft.y * relativeScale.value;
    return translateY;
  });

  return (
    <View collapsable={false}>
      <ImageView
        width={width}
        height={height}
        translateX={translateX}
        translateY={translateY}
      />
      <OverlayControl
        width={width}
        height={height}
        translateX={translateX}
        translateY={translateY}
      />
    </View>
  );
};
