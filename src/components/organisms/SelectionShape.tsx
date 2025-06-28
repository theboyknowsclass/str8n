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

export type SelectionShapeProps = {
  width: number;
  height: number;
};

const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);

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
    return 3 / relativeScale.value;
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
      <Animated.View
        style={[
          transform,
          {
            pointerEvents: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
          },
        ]}
      >
        <Svg width={svgDimensions.width} height={svgDimensions.height}>
          <AnimatedPolygon
            animatedProps={animatedProps}
            fill="transparent"
            stroke={colors.primary}
          />
        </Svg>
      </Animated.View>
    </View>
  );
};
