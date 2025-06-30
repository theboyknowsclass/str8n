import { useTheme } from '@react-navigation/native';
import { useImage, Image } from '@shopify/react-native-skia';
import { ImageSourcePropType } from 'react-native';

const checkerBoardLightSmall = require('@assets/checkerboard_light_30px.png');
const checkerBoardLightMedium = require('@assets/checkerboard_light_60px.png');
const checkerBoardLightLarge = require('@assets/checkerboard_light_120px.png');

const checkerBoardDarkSmall = require('@assets/checkerboard_dark_30px.png');
const checkerBoardDarkMedium = require('@assets/checkerboard_dark_60px.png');
const checkerBoardDarkLarge = require('@assets/checkerboard_dark_120px.png');

/**
 * Map of checkerboard patterns organized by theme and size.
 * Provides different checkerboard textures for various use cases.
 */
const checkerBoards = new Map<string, Map<string, ImageSourcePropType>>([
  [
    'light',
    new Map<string, ImageSourcePropType>([
      ['small', checkerBoardLightSmall],
      ['medium', checkerBoardLightMedium],
      ['large', checkerBoardLightLarge],
    ]),
  ],
  [
    'dark',
    new Map<string, ImageSourcePropType>([
      ['small', checkerBoardDarkSmall],
      ['medium', checkerBoardDarkMedium],
      ['large', checkerBoardDarkLarge],
    ]),
  ],
]);

export type ImageViewProps = {
  width: number;
  height: number;
};

export const ImageView: React.FC<ImageViewProps> = ({ width, height }) => {
  const image = useImage(require('@assets/checkerboard_light_30px.png'));

  return (
    <Image
      image={image}
      x={0}
      y={0}
      width={width}
      height={height}
      fit="cover"
    />
  );
};
