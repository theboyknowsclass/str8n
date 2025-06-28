import { Vector } from '@types';
import { createContext, RefObject, useRef } from 'react';
import { GestureType } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gesture';
import { SharedValue, useSharedValue } from 'react-native-reanimated';

interface PanZoomContextType {
  isReady: boolean;
  scale: SharedValue<number>;
  translate: SharedValue<Vector>;
  panGesture: RefObject<GestureType | undefined>;
}

export const PanZoomContext = createContext<PanZoomContextType>({
  isReady: false,
} as PanZoomContextType);

interface PanZoomProviderProps {
  children: React.ReactNode;
  initialScale: number;
  initialTranslate: Vector;
}

export const PanZoomProvider: React.FC<PanZoomProviderProps> = ({
  children,
  initialScale,
  initialTranslate,
}) => {
  const panGesture = useRef<GestureType | undefined>(undefined);
  const scale = useSharedValue(initialScale);
  const translate = useSharedValue(initialTranslate);

  const value = {
    isReady: true,
    scale,
    translate,
    panGesture,
  };

  return (
    <PanZoomContext.Provider value={value}>{children}</PanZoomContext.Provider>
  );
};
