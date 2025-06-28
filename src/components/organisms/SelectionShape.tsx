import { useTheme } from '@react-navigation/native';
import { useRef } from 'react';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useDerivedValue,
} from 'react-native-reanimated';
import { Polygon, Svg } from 'react-native-svg';
import { useEdit, usePanZoomContext, useEditContext } from '@hooks';
import { View } from 'react-native';
import { Point } from '@types';

/**
 * Props for the SelectionShape component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 */
export type SelectionShapeProps = {
  width: number;
  height: number;
};

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

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

  const path = useDerivedValue(() => {
    return relativePoints.value.map((p) => `${p.x},${p.y}`).join(' ');
  });

  const lineWidth = useDerivedValue(() => {
    return 3 / relativeScale.value, 1;
  });

  const transform = useAnimatedStyle(() => {
    // calculate the relative scale of the pan zoom scale to the initial pan zoom scale
    const relativeScale = panZoomScale.value / initialPanZoomScale.current;

    const xDiff = panZoomTranslate.value.x - initialPanZoomTranslate.current.x;
    const yDiff = panZoomTranslate.value.y - initialPanZoomTranslate.current.y;

    const translateX = xDiff * panZoomScale.value - topLeft.x * relativeScale;
    const translateY = yDiff * panZoomScale.value - topLeft.y * relativeScale;

    return {
      transform: [
        {
          translateX,
        },
        {
          translateY,
        },
        {
          scale: relativeScale,
        },
      ],
      transformOrigin: '0 0',
    };
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      points: path.value,
      strokeWidth: lineWidth.value,
    };
  });

  return (
    <View
      style={{
        width: width,
        height: height,
        pointerEvents: 'none',
        position: 'absolute',
        top: 0,
        left: 0,
      }}
    >
        <AnimatedSvg width={svgDimensions.width} height={svgDimensions.height}         style={[
          transform,
          {
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          },
        ]}>
          <AnimatedPolygon
            animatedProps={animatedProps}
            fill="transparent"
            stroke={colors.primary}
          />
        </AnimatedSvg>
    </View>
  );
};
