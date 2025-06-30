import { useTheme } from '@react-navigation/native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { useEdit } from '@hooks';
import { Point } from '@types';
import {
  Canvas,
  Group,
  Points,
  useImage,
  Image,
} from '@shopify/react-native-skia';
import { PointVisual } from './PointVisual';
import { CheckerBoard } from '@components/molecules/CheckerBoard';
import { PointGestureHandler } from './PointGestureHandler';
import { usePanZoomContext, useSelectionContext } from '@contexts';

const LINE_WIDTH = 3;
const POINT_RADIUS = 26;
const POINT_STROKE = 12;

/**
 * Props for the SelectionShape component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 */
export type SelectionControlProps = {
  width: number;
  height: number;
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
}) => {
  const { colors, dark } = useTheme();

  const {
    uri,
    imageDimensions: { width: imageWidth, height: imageHeight },
    checkerboardSize,
    borderWidth,
    borderHeight,
  } = useEdit({
    width,
    height,
  });

  const image = useImage(uri);

  const imageWidthRatio = width / imageWidth;
  const imageHeightRatio = height / imageHeight;
  const imageToControlRatio = Math.min(imageWidthRatio, imageHeightRatio);

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

  const { absolutePoints } = useSelectionContext();

  const relativePoints = useDerivedValue<Point[]>(() => {
    return absolutePoints.map((p) => ({
      x: (p.x.value / imageWidth) * initialScaledImageDimensions.width,
      y: (p.y.value / imageHeight) * initialScaledImageDimensions.height,
    }));
  }, [absolutePoints, imageWidth, imageHeight]);

  const pathPoints = useDerivedValue<Point[]>(() => {
    return [...relativePoints.value, relativePoints.value[0]];
  }, [relativePoints]);

  const lineWidth = useDerivedValue(() => {
    return LINE_WIDTH / relativeScale.value;
  });

  const pointSize = useDerivedValue(() => {
    return POINT_RADIUS / relativeScale.value;
  });

  const pointStroke = useDerivedValue(() => {
    return POINT_STROKE / relativeScale.value;
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
    return [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: relativeScale.value },
    ];
  });

  const imageTransform = useDerivedValue(() => {
    return [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: panZoomScale.value },
    ];
  }, [panZoomScale, panZoomTranslate]);

  const backgroundTransform = useDerivedValue(() => {
    return [
      { translateX: translateX.value - borderWidth * panZoomScale.value },
      { translateY: translateY.value - borderHeight * panZoomScale.value },
      { scale: relativeScale.value },
    ];
  });

  const scaledImageWidth = useDerivedValue(() => {
    return imageWidth * panZoomScale.value;
  });
  const scaledImageHeight = useDerivedValue(() => {
    return imageHeight * panZoomScale.value;
  });

  const imageBorderStyle = useAnimatedStyle(() => {
    return {
      top: translateY.value,
      left: translateX.value,
      width: scaledImageWidth.value,
      height: scaledImageHeight.value,
    };
  });

  return (
    <View style={styles.container}>
      <View style={styles.canvasContainer}>
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
          <Group transform={overlayTransform}>
            <Points
              points={pathPoints}
              mode="polygon"
              color={colors.primary}
              style="stroke"
              strokeWidth={lineWidth}
              strokeJoin="round"
              strokeCap="round"
              opacity={0.5}
            />
            {absolutePoints.map((p, i) => (
              <PointVisual
                key={`Point ${i}`}
                absolutePoint={p}
                pointRadius={pointSize}
                pointStroke={pointStroke}
                activeColor={colors.primary}
                imageWidth={imageWidth}
                imageHeight={imageHeight}
                canvasDimensions={initialScaledImageDimensions}
              />
            ))}
          </Group>
        </Canvas>
      </View>
      <Animated.View
        style={[styles.pointsGestureHandlerContainer, imageBorderStyle]}
      >
        {absolutePoints.map((p, i) => (
          <PointGestureHandler
            key={`Point ${i}`}
            absolutePoint={p}
            pointRadius={pointSize}
            pointStroke={pointStroke}
            imageWidth={imageWidth}
            imageHeight={imageHeight}
            canvasDimensions={initialScaledImageDimensions}
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
  canvasContainer: {
    position: 'absolute',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
  },
  imageBorder: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'blue',
  },
  pointsGestureHandlerContainer: {
    position: 'absolute',
    borderColor: 'red',
  },
});
