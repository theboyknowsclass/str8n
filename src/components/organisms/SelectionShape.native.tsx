import { useTheme } from '@react-navigation/native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';
import { useEdit, usePanZoomContext, useEditContext } from '@hooks';
import { Point } from '@types';
import {
  Canvas,
  Group,
  Points,
  useImage,
  Image,
  scale,
} from '@shopify/react-native-skia';
import { SelectionPointVisual } from './SelectionPointVisual.native';
import { CheckerBoard } from '@components/molecules/CheckerBoard';

const LINE_WIDTH = 3;
const POINT_SIZE = 26;
const POINT_STROKE = 12;

/**
 * Props for the SelectionShape component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 */
export type SelectionShapeProps = {
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
export const SelectionShape: React.FC<SelectionShapeProps> = ({
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

  const svgDimensions = {
    width: imageWidth * imageToControlRatio,
    height: imageHeight * imageToControlRatio,
  };

  const topLeft = {
    x: (svgDimensions.width - width) / 2,
    y: (svgDimensions.height - height) / 2,
  };

  const { scale: panZoomScale, translate: panZoomTranslate } =
    usePanZoomContext();

  // store the initial pan zoom scale and translate to calculate the relative position of the selection shape
  const initialPanZoomScale = useRef(panZoomScale.value);
  const initialPanZoomTranslate = useRef(panZoomTranslate.value);

  const relativeScale = useDerivedValue(() => {
    return panZoomScale.value / initialPanZoomScale.current;
  });

  const { absolutePoints } = useEditContext();

  const relativePoints = useDerivedValue<Point[]>(() => {
    return [...absolutePoints, absolutePoints[0]].map((p) => ({
      x: (p.x.value / imageWidth) * svgDimensions.width,
      y: (p.y.value / imageHeight) * svgDimensions.height,
    }));
  }, [absolutePoints, imageWidth, imageHeight]);

  const lineWidth = useDerivedValue(() => {
    return LINE_WIDTH / relativeScale.value;
  });

  const pointSize = useDerivedValue(() => {
    return POINT_SIZE / relativeScale.value;
  });

  const pointStroke = useDerivedValue(() => {
    return POINT_STROKE / relativeScale.value;
  });

  const translateX = useDerivedValue(() => {
    const xDiff = panZoomTranslate.value.x - initialPanZoomTranslate.current.x;
    return xDiff * panZoomScale.value - topLeft.x * relativeScale.value;
  });

  const translateY = useDerivedValue(() => {
    const yDiff = panZoomTranslate.value.y - initialPanZoomTranslate.current.y;
    return yDiff * panZoomScale.value - topLeft.y * relativeScale.value;
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

  return (
    <View style={styles.container}>
      <Canvas style={[styles.canvas, { width, height }]} pointerEvents="none">
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
            points={relativePoints}
            mode="polygon"
            color={colors.primary}
            style="stroke"
            strokeWidth={lineWidth}
            strokeJoin="round"
            strokeCap="round"
            opacity={0.5}
          />
          {absolutePoints.map((p, i) => (
            <SelectionPointVisual
              key={`Point ${i}`}
              absolutePoint={p}
              pointSize={pointSize}
              pointStroke={pointStroke}
              activeColor={colors.primary}
              imageWidth={imageWidth}
              imageHeight={imageHeight}
              canvasDimensions={svgDimensions}
            />
          ))}
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
  canvas: {
    position: 'absolute',
    pointerEvents: 'none',
    width: '100%',
    height: '100%',
    borderWidth: 10,
    borderColor: 'blue',
  },
});
