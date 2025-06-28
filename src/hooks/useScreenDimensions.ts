import { useWindowDimensions } from 'react-native';
import { DeviceType, deviceType } from 'expo-device';
import { ScreenSize } from '@types';

/**
 * Represents screen dimensions and device characteristics.
 * @property width - The screen width in pixels
 * @property height - The screen height in pixels
 * @property isLandscape - Whether the device is in landscape orientation
 * @property isMobile - Whether the device is a mobile phone or tablet
 * @property screenSize - The screen size category (SMALL for < 4M pixels, NOT_SMALL otherwise)
 */
type ScreenDimensions = {
  /** The screen width in pixels */
  width: number;
  /** The screen height in pixels */
  height: number;
  /** Whether the device is in landscape orientation */
  isLandscape: boolean;
  /** Whether the device is a mobile phone or tablet */
  isMobile: boolean;
  /** The screen size category based on total pixel count */
  screenSize: ScreenSize;
};

/**
 * Hook that provides screen dimensions and device characteristics.
 * Automatically updates when the screen dimensions change and provides
 * responsive design information for adaptive layouts.
 *
 * Features:
 * - Real-time screen dimension updates
 * - Device type detection (mobile vs desktop)
 * - Orientation detection (landscape vs portrait)
 * - Screen size categorization based on pixel count
 * - Responsive design support
 *
 * @returns ScreenDimensions object containing width, height, orientation, device type, and screen size
 *
 * @example
 * ```typescript
 * const { width, height, isMobile, isLandscape, screenSize } = useScreenDimensions();
 *
 * // Responsive layout example
 * if (isMobile) {
 *   // Mobile-specific layout
 * } else {
 *   // Desktop-specific layout
 * }
 * ```
 */
export const useScreenDimensions = (): ScreenDimensions => {
  const { width, height } = useWindowDimensions();
  const isMobile =
    deviceType === DeviceType.PHONE || deviceType === DeviceType.TABLET;

  return {
    width,
    height,
    isLandscape: width > height,
    isMobile,
    screenSize: getScreenSize(width, height),
  };
};

/**
 * Determines the screen size category based on total pixel count.
 * Categorizes screens as SMALL if they have fewer than 4 million pixels,
 * which typically corresponds to smaller mobile devices.
 *
 * @param width - Screen width in pixels
 * @param height - Screen height in pixels
 * @returns ScreenSize enum value (SMALL for < 4M pixels, NOT_SMALL otherwise)
 *
 * @example
 * ```typescript
 * const size = getScreenSize(1920, 1080); // Returns ScreenSize.NOT_SMALL
 * const size = getScreenSize(375, 667);   // Returns ScreenSize.SMALL
 * ```
 */
const getScreenSize = (width: number, height: number): ScreenSize => {
  const pixelCount = width * height;
  if (pixelCount < 4000000) {
    return ScreenSize.SMALL;
  }
  return ScreenSize.NOT_SMALL;
};
