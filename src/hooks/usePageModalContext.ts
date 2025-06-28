import { PageModalContext, PageModalContextType } from '@contexts';
import { useContext } from 'react';

/**
 * Hook to access the PageModal context.
 * Provides access to page modal functionality and state.
 *
 * @returns UsePageModalContext object containing modal state
 * @throws Error if used outside of PageModalContextProvider
 *
 * @example
 * ```typescript
 * const { isModalVisible, setIsModalVisible } = usePageModalContext();
 * ```
 */
export const usePageModalContext = (): PageModalContextType => {
  const context = useContext(PageModalContext);
  if (context === undefined) {
    throw new Error(
      'usePageModalContext must be used within a PageModalContextProvider'
    );
  }
  return context;
};
