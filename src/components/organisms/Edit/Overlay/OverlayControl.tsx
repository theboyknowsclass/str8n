import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import Animated, {
  SharedValue,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  Line,
  Mask,
  useImage,
  Image,
} from '@shopify/react-native-skia';
import { PointGestureHandler } from './PointGestureHandler';
import { usePageTemplateContext, usePanZoomContext } from '@contexts';
import { Point } from './Point';
import { SelectionPolygon } from './SelectionPolygon';
import { useEditControlContext } from '@contexts/EditControlContext';
import { useSourceImageStore } from '@stores';

const POINT_RADIUS = 26;
const POINT_STROKE = 12;
const POINT_SIZE = (POINT_RADIUS + POINT_STROKE) * 2;
const ZOOM_VIEW_RADIUS = 128;

/**
 * Props for the SelectionShape component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 * @property points - The points to display in relative coordinates (0-1)
 */
export type OverlayControlProps = {
  width: number;
  height: number;
  translateX: SharedValue<number>;
  translateY: SharedValue<number>;
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
export const OverlayControl: React.FC<OverlayControlProps> = ({
  width,
  height,
  translateX,
  translateY,
}) => {
  const { colors } = useTheme();

  const { scale } = usePanZoomContext();

  const { sourceImage } = useSourceImageStore();
  const image = useImage(sourceImage.uri);

  const {
    imageSize: { width: imageWidth, height: imageHeight },
    selectionPoints: points,
  } = useEditControlContext();

  const { contentOffset } = usePageTemplateContext();
  const { x: contentX, y: contentY } = contentOffset;
  const minZoomX = contentX + ZOOM_VIEW_RADIUS - 16;
  const maxZoomX = minZoomX + width - 2 * ZOOM_VIEW_RADIUS;
  const minZoomY = contentY + 24;
  const maxZoomY = minZoomY + height - 2 * ZOOM_VIEW_RADIUS;

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

  const accentColor = colors.primary;

  const aciveZoomPointIndex = useDerivedValue(() => {
    for (let i = 0; i < points.length; i++) {
      if (points[i].isActive.value) {
        return i;
      }
    }
    return null;
  });

  const zoomPointX = useDerivedValue(() => {
    if (aciveZoomPointIndex.value !== null) {
      return -points[aciveZoomPointIndex.value].x.value * imageWidth;
    }
    return withTiming(0, { duration: 1000 });
  });

  const zoomPointY = useDerivedValue(() => {
    if (aciveZoomPointIndex.value !== null) {
      return -points[aciveZoomPointIndex.value].y.value * imageHeight;
    }
    return withTiming(0, { duration: 1000 });
  });

  const zoomOpacity = useDerivedValue(() => {
    return withTiming(aciveZoomPointIndex.value !== null ? 1 : 0, {
      duration: 300,
    });
  });

  const zoomTransform = useDerivedValue(() => {
    if (aciveZoomPointIndex.value !== null) {
      let x = points[aciveZoomPointIndex.value].absoluteX.value;
      let y = points[aciveZoomPointIndex.value].absoluteY.value;

      x = Math.max(minZoomX, Math.min(maxZoomX, x));
      y = Math.max(minZoomY, Math.min(maxZoomY, y));

      return [{ translateX: x }, { translateY: y }];
    }
    return [{ translateX: 0 }, { translateY: 0 }];
  });

  return (
    <View>
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
              image={image}
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
            pointRadius={POINT_RADIUS}
          />
        </Group>
        <Group transform={zoomTransform} opacity={zoomOpacity}>
          <Circle
            cx={0}
            cy={0}
            style="fill"
            color={'black'}
            r={ZOOM_VIEW_RADIUS}
            opacity={zoomOpacity}
          />
          <Mask
            clip={true}
            mask={
              <Circle
                cx={0}
                cy={0}
                style="fill"
                color={'black'}
                r={ZOOM_VIEW_RADIUS}
                opacity={zoomOpacity}
              />
            }
          >
            <Image
              image={image}
              x={zoomPointX}
              y={zoomPointY}
              width={imageWidth}
              height={imageHeight}
            />
          </Mask>
          <Line
            p1={{ x: 0, y: -ZOOM_VIEW_RADIUS / 3 }}
            p2={{ x: 0, y: ZOOM_VIEW_RADIUS / 3 }}
            color={accentColor}
            strokeWidth={2}
          />
          <Line
            p1={{ x: -ZOOM_VIEW_RADIUS / 3, y: 0 }}
            p2={{ x: ZOOM_VIEW_RADIUS / 3, y: 0 }}
            color={accentColor}
            strokeWidth={2}
          />
        </Group>
      </Canvas>
      <Animated.View style={[styles.gestureHandler, overlayTransformStyle]}>
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
  gestureHandler: {
    position: 'absolute',
  },
});
