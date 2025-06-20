import { useWindowDimensions } from 'react-native';
import { DeviceType, deviceType } from 'expo-device';
import { ScreenSize } from '@types';

type ScreenDimensions = {
  width: number;
  height: number;
  isLandscape: boolean;
  isMobile: boolean;
  screenSize: ScreenSize;
};

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

const getScreenSize = (width: number, height: number): ScreenSize => {
  const pixelCount = width * height;
  if (pixelCount < 4000000) {
    return ScreenSize.SMALL;
  }
  return ScreenSize.NOT_SMALL;
};
