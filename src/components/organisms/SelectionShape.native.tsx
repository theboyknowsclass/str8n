import { useTheme } from '@react-navigation/native';
import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDerivedValue } from 'react-native-reanimated';
import { useEdit, usePanZoomContext, useEditContext } from '@hooks';
import { Point } from '@types';
import { Canvas, Circle, Group, Points } from '@shopify/react-native-skia';

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
  const { colors } = useTheme();

  const {
    imageDimensions: { width: imageWidth, height: imageHeight },
  } = useEdit({
    width,
    height,
  });

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
      x: (p.value.x / imageWidth) * svgDimensions.width,
      y: (p.value.y / imageHeight) * svgDimensions.height,
    }));
  }, [absolutePoints, imageWidth, imageHeight]);

  const lineWidth = useDerivedValue(() => {
    return 3 / relativeScale.value;
  });

  const transform = useDerivedValue(() => {
    // calculate the relative scale of the pan zoom scale to the initial pan zoom scale
    const relativeScale = panZoomScale.value / initialPanZoomScale.current;

    const xDiff = panZoomTranslate.value.x - initialPanZoomTranslate.current.x;
    const yDiff = panZoomTranslate.value.y - initialPanZoomTranslate.current.y;

    const translateX = xDiff * panZoomScale.value - topLeft.x * relativeScale;
    const translateY = yDiff * panZoomScale.value - topLeft.y * relativeScale;

    return [
      { translateX: translateX },
      { translateY: translateY },
      { scale: relativeScale },
    ];
  });

  return (
    <View style={styles.container}>
      <Canvas style={styles.canvas} pointerEvents="none">
        <Group transform={transform}>
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
  },
});
