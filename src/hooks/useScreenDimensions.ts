import { useWindowDimensions } from 'react-native';
import { DeviceType, deviceType } from 'expo-device';
import { ScreenSize } from '@types';

/**
 * Represents screen dimensions and device characteristics.
 * @property width - The screen width in pixels
 * @property height - The screen height in pixels
 * @property isLandscape - Whether the device is in landscape orientation
 * @property isMobile - Whether the device is a mobile phone
 * @property screenSize - The screen size category (SMALL or NOT_SMALL)
 */
type ScreenDimensions = {
  width: number;
  height: number;
  isLandscape: boolean;
  isMobile: boolean;
  screenSize: ScreenSize;
};

/**
 * Hook that provides screen dimensions and device characteristics.
 * Automatically updates when the screen dimensions change.
 *
 * @returns ScreenDimensions object containing width, height, orientation, device type, and screen size
 *
 * @example
 * ```typescript
 * const { width, height, isMobile, isLandscape } = useScreenDimensions();
 * ```
 */
export const useScreenDimensions = (): ScreenDimensions => {
  const { width, height } = useWindowDimensions();
  const isMobile = deviceType === DeviceType.PHONE;

  return {
    width,
    height,
    isLandscape: width > height,
    isMobile,
    screenSize: getScreenSize(width, height),
  };
};

/**
 * Determines the screen size category based on pixel count.
 *
 * @param width - Screen width in pixels
 * @param height - Screen height in pixels
 * @returns ScreenSize enum value (SMALL for < 4M pixels, NOT_SMALL otherwise)
 */
const getScreenSize = (width: number, height: number): ScreenSize => {
  const pixelCount = width * height;
  if (pixelCount < 4000000) {
    return ScreenSize.SMALL;
  }
  return ScreenSize.NOT_SMALL;
};
