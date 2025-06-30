import { useTheme } from '@react-navigation/native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { MovablePoint } from '@types';
import { Canvas, Group } from '@shopify/react-native-skia';
import { PointGestureHandler } from './PointGestureHandler';
import { usePanZoomContext } from '@contexts';
import { Point as PointComponent } from './Point';
import { SelectionPolygon } from './SelectionPolygon';
import { ImageView } from './ImageView';
import { useSourceImageStore } from '@stores';

const POINT_RADIUS = 26;
const POINT_STROKE = 12;
const POINT_SIZE = (POINT_RADIUS + POINT_STROKE) * 2;

/**
 * Props for the SelectionShape component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 * @property points - The points to display in relative coordinates (0-1)
 */
export type SelectionControlProps = {
  width: number;
  height: number;
  imageWidth: number;
  imageHeight: number;
  points: MovablePoint[];
};

/**
 * SelectionShape component that renders an animated polygon overlay.
 *
 * This component displays a visual representation of the current selection
 * area as a polygon shape. It responds to pan/zoom transformations and
 * updates in real-time as the user manipulates the selection points.
 * The shape is rendered as an SVG polygon with animated properties.
 *
 * @param props - SelectionShapeProps containing width and height
 * @returns JSX element containing the animated selection shape
 *
 * @example
 * ```typescript
 * <SelectionShape width={400} height={300} />
 * ```
 */
export const SelectionControl: React.FC<SelectionControlProps> = ({
  width,
  height,
  imageWidth,
  imageHeight,
  points,
}) => {
  const { colors } = useTheme();

  const imageToControlRatio = Math.min(
    width / imageWidth,
    height / imageHeight
  );

  const initialScaledImageDimensions = {
    width: imageWidth * imageToControlRatio,
    height: imageHeight * imageToControlRatio,
  };

  const initialTopLeft = {
    x: (initialScaledImageDimensions.width - width) / 2,
    y: (initialScaledImageDimensions.height - height) / 2,
  };

  const { scale: panZoomScale, translate: panZoomTranslate } =
    usePanZoomContext();

  // store the initial pan zoom scale and translate to calculate the relative position of the selection shape
  const initialPanZoomScale = useRef(panZoomScale.value);
  const initialPanZoomTranslate = useRef(panZoomTranslate.value);

  const relativeScale = useDerivedValue(() => {
    return panZoomScale.value / initialPanZoomScale.current;
  });

  const translateX = useDerivedValue(() => {
    const xDiff = panZoomTranslate.value.x - initialPanZoomTranslate.current.x;
    const translateX =
      xDiff * panZoomScale.value - initialTopLeft.x * relativeScale.value;
    return translateX;
  });

  const translateY = useDerivedValue(() => {
    const yDiff = panZoomTranslate.value.y - initialPanZoomTranslate.current.y;
    const translateY =
      yDiff * panZoomScale.value - initialTopLeft.y * relativeScale.value;
    return translateY;
  });

  const overlayTransform = useDerivedValue(() => {
    return [{ translateX: translateX.value }, { translateY: translateY.value }];
  });

  const scaledImageWidth = useDerivedValue(() => {
    return imageWidth * panZoomScale.value;
  });
  const scaledImageHeight = useDerivedValue(() => {
    return imageHeight * panZoomScale.value;
  });

  const translateToImageStyle = useAnimatedStyle(() => {
    return {
      top: translateY.value,
      left: translateX.value,
      width: scaledImageWidth.value,
      height: scaledImageHeight.value,
    };
  });

  return (
    <View style={styles.container}>
      <ImageView
        width={width}
        height={height}
        translateX={translateX}
        translateY={translateY}
      />
      <Canvas
        style={{
          width,
          height,
        }}
      >
        <Group transform={overlayTransform}>
          {points.map((p, i) => (
            <PointComponent
              key={`Point ${i}`}
              point={p}
              radius={POINT_RADIUS}
              strokeWidth={POINT_STROKE}
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
      <Animated.View
        style={[styles.pointsGestureHandlerContainer, translateToImageStyle]}
      >
        {points.map((p, i) => (
          <PointGestureHandler
            key={`Touchable Point ${i}`}
            point={p}
            initialPointSize={POINT_SIZE}
            scaledImageHeight={scaledImageHeight}
            scaledImageWidth={scaledImageWidth}
          />
        ))}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pointsGestureHandlerContainer: {
    position: 'absolute',
    borderColor: 'red',
  },
});
