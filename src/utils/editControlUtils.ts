import { Vector } from '@types';

const BORDER_PERCENTAGE = 0.2;
const MAX_SCALE = 2;

/**
 * Represents width and height dimensions
 * @property width - The width dimension
 * @property height - The height dimension
 */
interface Dimensions {
  width: number;
  height: number;
}

/**
 * Parameters for edit control calculations including imageWithBorder size, scale factors, and positioning
 * @property imageWithBorderSize - The calculated size of the image with border
 * @property initialScale - The initial scale factor for the image
 * @property minScale - The minimum allowed scale factor
 * @property maxScale - The maximum allowed scale factor
 * @property initialTranslate - The initial translation coordinates for positioning
 */
interface EditControlParams {
  imageWithBorderSize: Dimensions;
  initialScale: number;
  minScale: number;
  maxScale: number;
  initialTranslate: { x: number; y: number };
}

/**
 * Calculates the minimum imageWithBorder size needed to ensure a border around the image
 * @param imageWidth - The width of the source image
 * @param imageHeight - The height of the source image
 * @returns The minimum dimensions for the imageWithBorder background
 */
const calculateMinImageWithBorderSize = (
  imageWidth: number,
  imageHeight: number
): Dimensions => ({
  width: imageWidth * (1 + BORDER_PERCENTAGE * 2),
  height: imageHeight * (1 + BORDER_PERCENTAGE * 2),
});

/**
 * Calculates scale factors to fit the image within the available content area
 * @param width - The available width of the content area
 * @param height - The available height of the content area
 * @param imageWidth - The width of the source image
 * @param imageHeight - The height of the source image
 * @returns Object containing initialScale and minScale values
 */
const calculateScaleFactors = (
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): { initialScale: number; minScale: number } => {
  const widthScale = width / imageWidth;
  const heightScale = height / imageHeight;
  const initialScale = Math.min(widthScale, heightScale);
  const minScale = initialScale / (1 + BORDER_PERCENTAGE * 2);

  return { initialScale, minScale };
};

/**
 * Calculates the final imageWithBorder size, ensuring it's at least as large as the minimum required
 * @param minImageWithBorderSize - The minimum required imageWithBorder dimensions
 * @param width - The available width of the content area
 * @param height - The available height of the content area
 * @param minScale - The minimum scale factor
 * @returns The final imageWithBorder dimensions
 */
const calculateImageWithBorderSize = (
  minImageWithBorderSize: Dimensions,
  width: number,
  height: number,
  minScale: number
): Dimensions => ({
  width: Math.max(minImageWithBorderSize.width, Math.round(width / minScale)),
  height: Math.max(
    minImageWithBorderSize.height,
    Math.round(height / minScale)
  ),
});

/**
 * Calculates border dimensions to center the image within the imageWithBorder
 * @param imageWithBorderSize - The dimensions of the imageWithBorder
 * @param imageWidth - The width of the source image
 * @param imageHeight - The height of the source image
 * @returns The border dimensions for centering
 */
const calculateBorderDimensions = (
  imageWithBorderSize: Dimensions,
  imageWidth: number,
  imageHeight: number
): Dimensions => ({
  width: (imageWithBorderSize.width - imageWidth) / 2,
  height: (imageWithBorderSize.height - imageHeight) / 2,
});

/**
 * Calculates the initial translation position for the image, incorporating window size conversion
 * and centering calculations
 * @param borderDimensions - The border dimensions for centering within the imageWithBorder
 * @param width - The available width of the content area
 * @param height - The available height of the content area
 * @param initialScale - The initial scale factor
 * @param imageWidth - The width of the source image
 * @param imageHeight - The height of the source image
 * @returns The initial translation coordinates {x, y}
 */
const calculateInitialTranslate = (
  borderDimensions: Dimensions,
  width: number,
  height: number,
  initialScale: number,
  imageWidth: number,
  imageHeight: number
): Vector => {
  // Calculate the absolute window size in image coordinates
  const absoluteWindowSize = {
    width: width / initialScale,
    height: height / initialScale,
  };

  // Calculate offset to center the image within the visible window
  const centeringOffset = {
    width: (absoluteWindowSize.width - imageWidth) / 2,
    height: (absoluteWindowSize.height - imageHeight) / 2,
  };

  return {
    x: -borderDimensions.width + centeringOffset.width,
    y: -borderDimensions.height + centeringOffset.height,
  };
};

/**
 * Calculates all parameters needed for edit control, including imageWithBorder size, scale factors,
 * and initial positioning. This function orchestrates the complete calculation pipeline for
 * setting up an image editing interface with proper scaling and centering.
 *
 * @param width - The available width of the content area
 * @param height - The available height of the content area
 * @param imageWidth - The width of the source image
 * @param imageHeight - The height of the source image
 * @returns Complete edit control parameters including imageWithBorder size, scales, and positioning
 */
export const getEditControlParams = (
  width: number,
  height: number,
  imageWidth: number,
  imageHeight: number
): EditControlParams => {
  const minImageWithBorderSize = calculateMinImageWithBorderSize(
    imageWidth,
    imageHeight
  );

  const { initialScale, minScale } = calculateScaleFactors(
    width,
    height,
    imageWidth,
    imageHeight
  );

  const imageWithBorderSize = calculateImageWithBorderSize(
    minImageWithBorderSize,
    width,
    height,
    minScale
  );

  const borderDimensions = calculateBorderDimensions(
    imageWithBorderSize,
    imageWidth,
    imageHeight
  );

  const initialTranslate = calculateInitialTranslate(
    borderDimensions,
    width,
    height,
    initialScale,
    imageWidth,
    imageHeight
  );

  return {
    imageWithBorderSize,
    initialScale,
    minScale,
    maxScale: MAX_SCALE,
    initialTranslate,
  };
};
