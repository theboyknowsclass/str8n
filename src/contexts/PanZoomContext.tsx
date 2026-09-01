import { Dimensions, Vector } from '@types';
import { createContext, RefObject, useContext, useRef } from 'react';
import { GestureType } from 'react-native-gesture-handler/lib/typescript/handlers/gestures/gesture';
import {
  SharedValue,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';

/**
 * Context type for pan and zoom functionality.
 * Provides shared values and gesture references for image manipulation.
 * @property isReady - Boolean indicating if the context is ready
 * @property scale - Shared value for the current scale factor
 * @property translate - Shared value for the current translation vector
 * @property panGesture - Reference to the pan gesture handler
 */
export interface PanZoomContextType {
  isReady: boolean;
  scale: SharedValue<number>;
  minScale: number;
  maxScale: number;
  relativeScale: SharedValue<number>;
  translate: SharedValue<Vector>;
  initialScale: number;
  initialTranslate: Vector;
  initialTopLeft: Vector;
  panGesture: RefObject<GestureType | undefined>;
  contentSize: Dimensions;
}

/**
 * React context for pan and zoom functionality.
 * Provides shared state for image scaling and translation across components.
 */
export const PanZoomContext = createContext<PanZoomContextType | undefined>(
  undefined
);

/**
 * Props for the PanZoomProvider component.
 * @property children - React nodes to be wrapped by the provider
 * @property initialScale - The initial scale factor for the image
 * @property initialTranslate - The initial translation vector for the image
 */
export interface PanZoomContextProviderProps {
  children?: React.ReactNode | React.ReactNode[];
  initialScale: number;
  initialTranslate: Vector;
  initialTopLeft: Vector;
  minScale: number;
  maxScale: number;
  contentSize: Dimensions;
}

/**
 * Provider component for pan and zoom functionality.
 * Initializes shared values for scale and translation, and provides gesture references.
 *
 * @param props - PanZoomProviderProps containing children and initial values
 * @returns PanZoomContext.Provider wrapping the children
 *
 * @example
 * ```typescript
 * <PanZoomProvider initialScale={1} initialTranslate={{ x: 0, y: 0 }}>
 *   <ImageComponent />
 * </PanZoomProvider>
 * ```
 */
export const PanZoomContextProvider: React.FC<PanZoomContextProviderProps> = ({
  children,
  initialScale,
  initialTranslate,
  initialTopLeft,
  minScale,
  maxScale,
  contentSize,
}) => {
  const panGesture = useRef<GestureType | undefined>(undefined);
  const scale = useSharedValue(initialScale);
  const translate = useSharedValue(initialTranslate);
  const relativeScale = useDerivedValue(() => {
    return scale.value / initialScale;
  });

  const value = {
    isReady: true,
    scale,
    minScale,
    maxScale,
    translate,
    initialScale,
    initialTranslate,
    initialTopLeft,
    panGesture,
    contentSize,
    relativeScale,
  };

  return (
    <PanZoomContext.Provider value={value}>{children}</PanZoomContext.Provider>
  );
};

/**
 * Hook to access the PanZoom context.
 * Provides access to pan and zoom functionality and state.
 *
 * @returns PanZoomContextType object containing pan/zoom state
 * @throws Error if used outside of PanZoomProvider
 *
 * @example
 * ```typescript
 * const { scale, translate, panGesture } = usePanZoomContext();
 * ```
 */
export const usePanZoomContext = (): PanZoomContextType => {
  const context = useContext(PanZoomContext);
  if (context === undefined) {
    throw new Error('usePanZoomContext must be used within a PanZoomProvider');
  }
  return context;
};
