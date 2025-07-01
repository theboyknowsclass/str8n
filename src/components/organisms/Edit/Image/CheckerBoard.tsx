import React from 'react';
import { Skia, SkPath, Group, Path } from '@shopify/react-native-skia';

/**
 * Props for the CheckerBoard component.
 * @property width - The width of the checkerboard in pixels
 * @property height - The height of the checkerboard in pixels
 * @property isDarkMode - Whether to use dark mode colors
 */
export interface CheckerBoardProps {
  width: number;
  height: number;
  isDarkMode: boolean;
}

const CHECKER_BOARD_COUNT = 20;
const CHECKER_BOARD_DARK_COLOR = '#111111';
const CHECKER_BOARD_DARK_ALT_COLOR = '#222222';
const CHECKER_BOARD_LIGHT_COLOR = '#eeeeee';
const CHECKER_BOARD_LIGHT_ALT_COLOR = '#cccccc';

/**
 * CheckerBoard component that renders a checkered background pattern using Skia.
 *
 * This component is used to visually indicate transparency or background in image editing.
 * It adapts its color scheme based on the dark mode setting.
 *
 * @param props - CheckerBoardProps containing width, height, and isDarkMode
 * @returns JSX element containing the checkerboard pattern
 *
 * @example
 * ```tsx
 * <CheckerBoard width={400} height={300} isDarkMode={false} />
 * ```
 */
export const CheckerBoard: React.FC<CheckerBoardProps> = ({
  width,
  height,
  isDarkMode,
}) => {
  const paths = React.useMemo(() => createPath(width, height), [width, height]);

  return (
    <Group>
      <Path
        path={paths.path}
        color={
          isDarkMode ? CHECKER_BOARD_DARK_COLOR : CHECKER_BOARD_LIGHT_COLOR
        }
      />
      <Path
        path={paths.path_alt}
        color={
          isDarkMode
            ? CHECKER_BOARD_DARK_ALT_COLOR
            : CHECKER_BOARD_LIGHT_ALT_COLOR
        }
      />
    </Group>
  );
};

const createPath = (
  width: number,
  height: number
): { path: SkPath; path_alt: SkPath } => {
  const size = width / CHECKER_BOARD_COUNT;

  let x = 0;
  let y = 0;

  let flip = false;
  let firstRowFlip = false;

  const path = Skia.Path.Make();
  const path_alt = Skia.Path.Make();

  while (x < width) {
    while (y < height) {
      if (flip) {
        path.addRect({ x, y, width: size, height: size });
      } else {
        path_alt.addRect({ x, y, width: size, height: size });
      }
      flip = !flip;
      y += size;
    }
    x += size;
    y = 0;
    firstRowFlip = !firstRowFlip;
    flip = firstRowFlip;
  }
  return { path, path_alt };
};
