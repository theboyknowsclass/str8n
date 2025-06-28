import { useOverlayStore, useSourceImageStore } from '@stores';
import { Point } from '@types';
import { createContext, useMemo } from 'react';
import { makeMutable, SharedValue } from 'react-native-reanimated';

/**
 * Context type for edit functionality.
 * Provides shared values for absolute point coordinates used in image editing.
 * @property absolutePoints - Array of shared values representing absolute point coordinates
 */
export interface EditContextType {
  absolutePoints: SharedValue<Point>[];
}

/**
 * React context for edit functionality.
 * Provides shared state for absolute point coordinates across editing components.
 */
export const EditContext = createContext<EditContextType>({
  absolutePoints: [],
} as EditContextType);

/**
 * Props for the EditProvider component.
 * @property children - React nodes to be wrapped by the provider
 */
interface EditProviderProps {
  children: React.ReactNode;
}

/**
 * Provider component for edit functionality.
 * Converts relative point coordinates to absolute coordinates and provides them as shared values.
 *
 * @param props - EditProviderProps containing children
 * @returns EditContext.Provider wrapping the children
 *
 * @example
 * ```typescript
 * <EditProvider>
 *   <EditComponent />
 * </EditProvider>
 * ```
 */
export const EditProvider: React.FC<EditProviderProps> = ({ children }) => {
  const {
    sourceImage: {
      dimensions: { width, height },
    },
  } = useSourceImageStore();
  const points = useOverlayStore((state) => state.points);

  const absolutePoints = useMemo(() => {
    return points.map((p) =>
      makeMutable({
        x: p.x * width,
        y: p.y * height,
      })
    );
  }, [points, width, height]);

  const value = {
    absolutePoints,
  };

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
};
