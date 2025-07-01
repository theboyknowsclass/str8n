import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Canvas, Group, useImage } from '@shopify/react-native-skia';
import { PointGestureHandler } from './PointGestureHandler';
import { usePanZoomContext } from '@contexts';
import { Point } from './Point';
import { SelectionPolygon } from './SelectionPolygon';
import { useEditControlContext } from '@contexts/EditControlContext';
import { useSourceImageStore } from '@stores';
import { POINT_RADIUS, POINT_SIZE, POINT_STROKE } from './constants';

/**
 * Props for the OverlayControl component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 * @property translateX - Shared animated value for horizontal translation
 * @property translateY - Shared animated value for vertical translation
 */
export type OverlayControlProps = {
  width: number;
  height: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
};

/**
 * OverlayControl component that renders an animated polygon overlay.
 *
 * This component displays a visual representation of the current selection
 * area as a polygon shape. It responds to pan/zoom transformations and
 * updates in real-time as the user manipulates the selection points.
 * The shape is rendered as an SVG polygon with animated properties.
 *
 * UX constants like point radius, stroke width, and line width are now
 * controlled internally and no longer need to be passed as props.
 *
 * @param props - OverlayControlProps containing dimensions and translation values
 * @returns JSX element containing the animated selection shape
 *
 * @example
 * ```typescript
 * <OverlayControl width={400} height={300} translateX={translateX} translateY={translateY} />
 * ```
 */
export const OverlayControl: React.FC<OverlayControlProps> = ({
  width,
  height,
  translateX,
  translateY,
}) => {
  const { colors } = useTheme();
  const { scale } = usePanZoomContext();

  const {
    imageSize: { width: imageWidth, height: imageHeight },
    selectionPoints: points,
  } = useEditControlContext();

  const overlayTransform = useDerivedValue(() => {
    return [{ translateX: translateX.value }, { translateY: translateY.value }];
  });

  const scaledImageWidth = useDerivedValue(() => {
    return imageWidth * scale.value;
  });
  const scaledImageHeight = useDerivedValue(() => {
    return imageHeight * scale.value;
  });

  const overlayTransformStyle = useAnimatedStyle(() => {
    return {
      top: translateY.value,
      left: translateX.value,
    };
  });

  return (
    <View collapsable={false}>
      <Canvas
        style={{
          width,
          height,
        }}
      >
        <Group transform={overlayTransform}>
          {points.map((p, i) => (
            <Point
              key={`Point ${i}`}
              point={p}
              activeColor={colors.primary}
              scaledImageWidth={scaledImageWidth}
              scaledImageHeight={scaledImageHeight}
            />
          ))}
          <SelectionPolygon
            points={points}
            color={colors.primary}
            scaledImageHeight={scaledImageHeight}
            scaledImageWidth={scaledImageWidth}
          />
        </Group>
      </Canvas>
      <Animated.View style={[styles.gestureHandler, overlayTransformStyle]}>
        {points.map((p, i) => (
          <PointGestureHandler
            key={`Touchable Point ${i}`}
            point={p}
            scaledImageHeight={scaledImageHeight}
            scaledImageWidth={scaledImageWidth}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  gestureHandler: {
    position: 'absolute',
  },
});
