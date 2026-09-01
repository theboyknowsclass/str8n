import { useState } from 'react';
import Animated, {
  SharedValue,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useDerivedValue,
} from 'react-native-reanimated';
import { Line, Polygon } from 'react-native-svg';
import { LogoStartPoints, useGetDerivedX, useGetDerivedY } from './useLogo';

const AnimatedLine = Animated.createAnimatedComponent(Line);

/**
 * Props for the Path component.
 * @property strokeWidth - The width of the stroke in pixels
 * @property scale - The scale factor for the path
 * @property animationProgress - Shared value controlling animation progress
 * @property background - The background color of the path
 * @property foreground - The foreground/stroke color of the path
 */
type PathProps = {
  strokeWidth: number;
  scale: number;
  animationProgress: SharedValue<number>;
  background: string;
  foreground: string;
};

/**
 * Path component that renders the logo's four corner-connecting edges,
 * plus the fill behind them.
 *
 * The stroke is drawn as four separate Line elements (numeric x1/y1/x2/y2
 * props) rather than a single Polygon with a dynamically-computed "points"
 * string: on native, react-native-reanimated's useAnimatedProps does not
 * reliably update a Polygon/Polyline's points string (a known, unresolved
 * upstream issue - software-mansion/react-native-reanimated#6065), while
 * numeric SVG props like Circle's cx/cy (see Point.tsx) animate correctly.
 *
 * The fill still needs an actual Polygon (Line has no fill), so its points
 * are pushed through a plain React state update via useAnimatedReaction +
 * runOnJS instead of useAnimatedProps - a normal React re-render, not
 * reliant on the same native animated-props bridge that doesn't update a
 * points string reliably. This trades perfect 60fps UI-thread smoothness for
 * the fill specifically, which isn't noticeable at this animation's slow,
 * eased pace.
 *
 * @param props - PathProps containing styling and animation parameters
 * @returns JSX element containing the filled polygon and its animated edges
 *
 * @example
 * ```typescript
 * <Path
 *   strokeWidth={2}
 *   scale={1.0}
 *   animationProgress={progress}
 *   background="#000000"
 *   foreground="#FFFFFF"
 * />
 * ```
 */
export const Path = ({
  strokeWidth,
  scale,
  animationProgress,
  background,
  foreground,
}: PathProps) => {
  const scaledStrokeWidth = strokeWidth * scale;
  const x1 = useGetDerivedX(0, scale, animationProgress);
  const y1 = useGetDerivedY(0, scale, animationProgress);
  const x2 = useGetDerivedX(1, scale, animationProgress);
  const y2 = useGetDerivedY(1, scale, animationProgress);
  const x3 = useGetDerivedX(2, scale, animationProgress);
  const y3 = useGetDerivedY(2, scale, animationProgress);
  const x4 = useGetDerivedX(3, scale, animationProgress);
  const y4 = useGetDerivedY(3, scale, animationProgress);

  const points = useDerivedValue(() => {
    return `${x1.value},${y1.value} ${x2.value},${y2.value} ${x3.value},${y3.value} ${x4.value},${y4.value}`;
  });

  // Seeded from the plain LogoStartPoints constant (animationProgress's
  // initial value is 0, i.e. the start points) rather than reading
  // points.value here - reading a shared/derived value's .value during
  // render is unsafe. useAnimatedReaction below overwrites this with the
  // real animated value on mount, before the seed is ever visibly wrong.
  const [fillPoints, setFillPoints] = useState(() =>
    LogoStartPoints.map((p) => `${p.x * scale},${p.y * scale}`).join(' ')
  );
  useAnimatedReaction(
    () => points.value,
    (current) => {
      runOnJS(setFillPoints)(current);
    }
  );

  const edge1Props = useAnimatedProps(() => ({
    x1: x1.value,
    y1: y1.value,
    x2: x2.value,
    y2: y2.value,
  }));
  const edge2Props = useAnimatedProps(() => ({
    x1: x2.value,
    y1: y2.value,
    x2: x3.value,
    y2: y3.value,
  }));
  const edge3Props = useAnimatedProps(() => ({
    x1: x3.value,
    y1: y3.value,
    x2: x4.value,
    y2: y4.value,
  }));
  const edge4Props = useAnimatedProps(() => ({
    x1: x4.value,
    y1: y4.value,
    x2: x1.value,
    y2: y1.value,
  }));

  return (
    <>
      <Polygon points={fillPoints} fill={background} />
      <AnimatedLine
        animatedProps={edge1Props}
        stroke={foreground}
        strokeWidth={scaledStrokeWidth}
      />
      <AnimatedLine
        animatedProps={edge2Props}
        stroke={foreground}
        strokeWidth={scaledStrokeWidth}
      />
      <AnimatedLine
        animatedProps={edge3Props}
        stroke={foreground}
        strokeWidth={scaledStrokeWidth}
      />
      <AnimatedLine
        animatedProps={edge4Props}
        stroke={foreground}
        strokeWidth={scaledStrokeWidth}
      />
    </>
  );
};
