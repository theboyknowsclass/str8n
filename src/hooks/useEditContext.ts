import { useContext } from 'react';
import { EditContext, EditContextType } from '@contexts';

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
export const useEditContext = (): EditContextType => {
  const context = useContext(EditContext);
  if (context === undefined) {
    throw new Error('useEditContext must be used within an EditProvider');
  }
  return context;
};
