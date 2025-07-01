import { useTheme } from '@react-navigation/native';
import { StyleSheet, View } from 'react-native';
import {
  useAnimatedReaction,
  useDerivedValue,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {
  Canvas,
  Circle,
  Group,
  Line,
  Mask,
  Image,
  SkImage,
} from '@shopify/react-native-skia';
import { usePageTemplateContext } from '@contexts';
import { useEditControlContext } from '@contexts/EditControlContext';
import { MIN_DISTANCE_FROM_POINT, ZOOM_VIEW_RADIUS } from './constants';

export type ZoomViewProps = {
  width: number;
  height: number;
  image: SkImage | null;
};

export const ZoomView: React.FC<ZoomViewProps> = ({ width, height, image }) => {
  const { colors } = useTheme();

  const {
    imageSize: { width: imageWidth, height: imageHeight },
    selectionPoints: points,
  } = useEditControlContext();

  const { contentOffset } = usePageTemplateContext();
  const minZoomX = contentOffset.x + ZOOM_VIEW_RADIUS - 16;
  const maxZoomX = minZoomX + width - 2 * ZOOM_VIEW_RADIUS;
  const minZoomY = contentOffset.y + 24;
  const maxZoomY = minZoomY + height - 2 * ZOOM_VIEW_RADIUS;

  const accentColor = colors.primary;

  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

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

  useAnimatedReaction(
    () => {
      const activePoint =
        aciveZoomPointIndex.value !== null
          ? points[aciveZoomPointIndex.value]
          : null;
      return activePoint;
    },
    (point) => {
      if (point !== null) {
        const absoluteX = point.absoluteX.value - contentOffset.x;
        const absoluteY = point.absoluteY.value - contentOffset.y;

        let x = absoluteX;
        let y = absoluteY;

        // try to make the zoom straight above the
        y -= MIN_DISTANCE_FROM_POINT;

        // min and max this to the bounds
        y = Math.max(minZoomY, Math.min(maxZoomY, y));

        // is the zoom point too close to the top edge
        if (y <= minZoomY) {
          // calculate the distance to the top edge
          const yComp = absoluteY - y;

          // calculate the x component we need to keep the zoom point at the same distance from the point
          const xComp = Math.sqrt(MIN_DISTANCE_FROM_POINT ** 2 - yComp ** 2);

          // calculate the distance to the right and left edges
          const distanceToRight = maxZoomX - absoluteX;
          const distanceToLeft = absoluteX - minZoomX;

          if (distanceToRight < distanceToLeft) {
            // move left
            x -= xComp;
          } else {
            // move right
            x += xComp;
          }
        }

        x = Math.max(minZoomX, Math.min(maxZoomX, x));

        translateX.value = x;
        translateY.value = y;
      }
    }
  );

  const zoomTransform = useDerivedValue(() => {
    return [{ translateX: translateX.value }, { translateY: translateY.value }];
  });

  return (
    <View style={styles.container} collapsable={false}>
      <Canvas
        style={{
          width,
          height,
        }}
      >
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
