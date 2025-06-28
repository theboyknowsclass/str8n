import { useSourceImageStore } from '@stores';
import { Dimensions } from '@types';

const BORDER_PERCENTAGE = 0.2;
const MAX_SCALE = 1;

interface UseEditReturn {
  uri: string | null;
  imageDimensions: Dimensions;
  checkerboardSize: Dimensions;
  initialScale: number;
  minScale: number;
  maxScale: number;
  initialTranslate: { x: number; y: number };
  borderWidth: number;
  borderHeight: number;
}

export const useEdit = (contentDimensions: Dimensions): UseEditReturn => {
  const { sourceImage } = useSourceImageStore();
  const { uri, dimensions: imageDimensions } = sourceImage;

  // Calculate minimum checkerboard size to ensure border around the image
  const minCheckerboardWidth =
    imageDimensions.width * (1 + BORDER_PERCENTAGE * 2);
  const minCheckerboardHeight =
    imageDimensions.height * (1 + BORDER_PERCENTAGE * 2);

  // Calculate scale factors to fit image within available content area
  const widthScale = contentDimensions.width / imageDimensions.width;
  const heightScale = contentDimensions.height / imageDimensions.height;
  // Use the smaller scale to ensure image fits completely
  const initialScale = Math.min(widthScale, heightScale);
  // Minimum scale ensures checkerboard border is always visible
  const minScale = initialScale / (1 + BORDER_PERCENTAGE * 2);

  // Calculate final checkerboard size, ensuring it's at least as large as the minimum required
  const checkerboardSize = {
    width: Math.max(
      minCheckerboardWidth,
      Math.round(contentDimensions.width / minScale)
    ),
    height: Math.max(
      minCheckerboardHeight,
      Math.round(contentDimensions.height / minScale)
    ),
  };

  // Calculate the absolute window size in image coordinates
  const absoluteWindowSize = {
    width: contentDimensions.width / initialScale,
    height: contentDimensions.height / initialScale,
  };

  // Calculate border dimensions to center the image within the checkerboard
  const borderWidth = (checkerboardSize.width - imageDimensions.width) / 2;
  const borderHeight = (checkerboardSize.height - imageDimensions.height) / 2;

  // Calculate offset to center the image within the visible window
  const offsetX = (absoluteWindowSize.width - imageDimensions.width) / 2;
  const offsetY = (absoluteWindowSize.height - imageDimensions.height) / 2;
  // Initial translation positions the image correctly within the checkerboard
  const initialTranslate = {
    x: -borderWidth + offsetX,
    y: -borderHeight + offsetY,
  };

  return {
    uri,
    imageDimensions,
    checkerboardSize,
    initialScale,
    minScale,
    maxScale: MAX_SCALE,
    initialTranslate,
    borderWidth,
    borderHeight,
  };
};
