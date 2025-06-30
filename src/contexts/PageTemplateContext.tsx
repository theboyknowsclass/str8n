import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Dimensions } from '@types';

/**
 * Context type for page template functionality.
 * Provides dimensions and ready state management for page layout.
 * @property dimensions - The current dimensions of the page template
 * @property isReady - Boolean indicating if the template is ready
 * @property setDimensions - Function to update the template dimensions
 * @property setIsReady - Function to update the ready state
 */
export interface PageTemplateContextType {
  dimensions: Dimensions;
  isReady: boolean;
  setDimensions: (dimensions: Dimensions) => void;
  setIsReady: (isReady: boolean) => void;
}

/**
 * React context for page template functionality.
 * Provides shared state for page dimensions and ready status across components.
 */
export const PageTemplateContext = createContext<PageTemplateContextType>({
  dimensions: { width: 0, height: 0 },
  setDimensions: () => {},
  isReady: false,
  setIsReady: () => {},
});

/**
 * Props for the PageTemplateContextProvider component.
 * @property children - React nodes to be wrapped by the provider
 */
interface PageTemplateProviderProps {
  children: ReactNode;
}

/**
 * Provider component for page template functionality.
 * Manages page dimensions and ready state, providing them to child components.
 *
 * @param props - PageTemplateProviderProps containing children
 * @returns PageTemplateContext.Provider wrapping the children
 *
 * @example
 * ```typescript
 * <PageTemplateContextProvider>
 *   <PageComponent />
 * </PageTemplateContextProvider>
 * ```
 */
export const PageTemplateContextProvider: React.FC<
  PageTemplateProviderProps
> = ({ children }) => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const [isReady, setIsReady] = useState(false);

  const value = {
    dimensions,
    isReady,
    setDimensions,
    setIsReady,
  };

  return (
    <PageTemplateContext.Provider value={value}>
      {children}
    </PageTemplateContext.Provider>
  );
};

/**
 * Hook to access the PageTemplate context.
 * Provides access to page template functionality and state.
 *
 * @returns PageTemplateContextType object containing template state
 * @throws Error if used outside of PageTemplateContextProvider
 *
 * @example
 * ```typescript
 * const { dimensions, isReady } = usePageTemplateContext();
 * ```
 */
export const usePageTemplateContext = (): PageTemplateContextType => {
  const context = useContext(PageTemplateContext);
  if (context === undefined) {
    throw new Error(
      'usePageTemplateContext must be used within a PageTemplateContextProvider'
    );
  }
  return context;
};
