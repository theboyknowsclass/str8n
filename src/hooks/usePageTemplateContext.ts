import { useContext } from 'react';
import { PageTemplateContext, PageTemplateContextType } from '@contexts';

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
