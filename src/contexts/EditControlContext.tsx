import { createContext, useContext } from 'react';
import { Dimensions, MovablePoint } from '@types';

/**
 * Context interface for sharing edit control state across components.
 * This context is used to share the current image URI, image dimensions,
 * and selection points with all edit selection controls in the application.
 *
 * @property {string | null} uri - The URI of the currently loaded image, or null if no image is loaded
 * @property {Dimensions} imageSize - The dimensions (width and height) of the currently loaded image
 * @property {MovablePoint[]} selectionPoints - Array of movable points that define the current selection area
 */
export interface EditControlContextType {
  uri: string | null;
  imageSize: Dimensions;
  selectionPoints: MovablePoint[];
}

/**
 * React context for sharing edit control state.
 * Provides access to the current image URI, image dimensions, and selection points
 * to all child components that need to interact with the edit selection controls.
 */
export const EditControlContext = createContext<EditControlContextType>({
  uri: null,
  imageSize: { width: 0, height: 0 },
  selectionPoints: [],
});

/**
 * Props for the EditControlContextProvider component.
 * Extends the EditControlContextType to include the children prop.
 *
 * @property {React.ReactNode | React.ReactNode[]} children - React children to be wrapped by the context provider
 */
export interface EditControlContextProviderProps extends EditControlContextType {
  children?: React.ReactNode | React.ReactNode[];
}

/**
 * Provider component for the EditControlContext.
 * Wraps child components with the edit control context, making the current
 * image URI, dimensions, and selection points available to all descendants.
 *
 * @param props - The provider props including context values and children
 * @returns A context provider that shares edit control state
 */
export const EditControlContextProvider: React.FC<
  EditControlContextProviderProps
> = ({ children, ...value }) => {
  return (
    <EditControlContext.Provider value={value}>
      {children}
    </EditControlContext.Provider>
  );
};

/**
 * Custom hook to access the EditControlContext.
 * Provides type-safe access to the current image URI, dimensions, and selection points.
 * Must be used within a component that is wrapped by EditControlContextProvider.
 *
 * @returns The current edit control context values
 * @throws Error if used outside of an EditControlContextProvider
 *
 * @example
 * ```tsx
 * const { uri, imageSize, selectionPoints } = useEditControlContext();
 * ```
 */
export const useEditControlContext: () => EditControlContextType = () => {
  const context = useContext(EditControlContext);
  if (!context) {
    throw new Error(
      'useEditControlContext must be used within an EditControlContextProvider'
    );
  }
  return context;
};
