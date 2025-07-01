import React, { createContext, useState, ReactNode, useContext } from 'react';
import { Dimensions, Vector } from '@types';

/**
 * Context type for page template functionality.
 * Provides content dimensions, offset, and ready state management for page layout.
 * @property contentDimensions - The current dimensions of the content area
 * @property contentOffset - The offset vector for content positioning
 * @property isTemplateReady - Boolean indicating if the template is ready
 * @property isContentReady - Boolean indicating if the content is ready
 * @property setContentDimensions - Function to update the content dimensions
 * @property setContentOffset - Function to update the content offset
 * @property setIsTemplateReady - Function to update the template ready state
 * @property setIsContentReady - Function to update the content ready state
 */
export interface PageTemplateContextType {
  contentDimensions: Dimensions;
  contentOffset: Vector;
  isTemplateReady: boolean;
  isContentReady: boolean;
  setContentDimensions: (dimensions: Dimensions) => void;
  setContentOffset: (offset: Vector) => void;
  setIsTemplateReady: (isTemplateReady: boolean) => void;
  setIsContentReady: (isContentReady: boolean) => void;
}

/**
 * React context for page template functionality.
 * Provides shared state for content dimensions, offset, and ready status across components.
 */
export const PageTemplateContext = createContext<PageTemplateContextType>({
  contentDimensions: { width: 0, height: 0 },
  contentOffset: { x: 0, y: 0 },
  isTemplateReady: false,
  isContentReady: false,
  setContentDimensions: () => {},
  setContentOffset: () => {},
  setIsTemplateReady: () => {},
  setIsContentReady: () => {},
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
 * Manages content dimensions, offset, and ready state, providing them to child components.
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
  const [contentDimensions, setContentDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const [contentOffset, setContentOffset] = useState<Vector>({
    x: 0,
    y: 0,
  });
  const [isTemplateReady, setIsTemplateReady] = useState(false);
  const [isContentReady, setIsContentReady] = useState(false);

  const value = {
    contentDimensions,
    contentOffset,
    isTemplateReady,
    isContentReady,
    setContentDimensions,
    setContentOffset,
    setIsTemplateReady,
    setIsContentReady,
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
 * const { contentDimensions, contentOffset, isTemplateReady, isContentReady } = usePageTemplateContext();
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
