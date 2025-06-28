import { useContext } from 'react';
import { PanZoomContext, PanZoomContextType } from '@contexts';

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
