import { useOverlayStore, useSourceImageStore } from '@stores';
import { MovablePoint } from '@types';
import { createContext, useContext, useMemo } from 'react';
import { makeMutable } from 'react-native-reanimated';

/**
 * Context type for edit functionality.
 * Provides shared values for absolute point coordinates used in image editing.
 * @property absolutePoints - Array of shared values representing absolute point coordinates
 */
export interface SelectionContextType {
  absolutePoints: MovablePoint[];
  imageDimensions: { width: number; height: number };
}

/**
 * React context for edit functionality.
 * Provides shared state for absolute point coordinates across editing components.
 */
export const SelectionContext = createContext<SelectionContextType>({
  absolutePoints: [],
  imageDimensions: { width: 0, height: 0 },
} as SelectionContextType);

/**
 * Props for the EditProvider component.
 * @property children - React nodes to be wrapped by the provider
 */
interface SelectionProviderProps {
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
export const SelectionProvider: React.FC<SelectionProviderProps> = ({
  children,
}) => {
  const {
    sourceImage: {
      dimensions: { width, height },
    },
  } = useSourceImageStore();
  const points = useOverlayStore((state) => state.points);

  const absolutePoints = useMemo(() => {
    return points.map((p) => ({
      x: makeMutable(p.x * width),
      y: makeMutable(p.y * height),
      isActive: makeMutable(false),
    }));
  }, [points, width, height]);

  const value = {
    absolutePoints,
    imageDimensions: { width, height },
  };

  return (
    <SelectionContext.Provider value={value}>
      {children}
    </SelectionContext.Provider>
  );
};

/**
 * Hook to access the Edit context.
 * Provides access to absolute point coordinates for image editing.
 *
 * @returns EditContextType object containing absolute point coordinates
 * @throws Error if used outside of EditProvider
 *
 * @example
 * ```typescript
 * const { absolutePoints } = useEditContext();
 * ```
 */
export const useSelectionContext = (): SelectionContextType => {
  const context = useContext(SelectionContext);
  if (context === undefined) {
    throw new Error('useEditContext must be used within an EditProvider');
  }
  return context;
};
