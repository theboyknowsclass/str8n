import {
  PanZoomGestureHandler,
  PanZoomGestureHandlerProps,
} from './PanZoomGestureHandler';
import {
  PanZoomContextProvider,
  PanZoomContextProviderProps,
} from '@contexts/PanZoomContext';

/**
 * Props for the PanZoomControl component.
 * Inherits all props from PanZoomGestureHandlerProps and PanZoomContextProviderProps.
 */
interface PanZoomControlProps
  extends PanZoomGestureHandlerProps,
    PanZoomContextProviderProps {}

/**
 * PanZoomControl component that provides pan/zoom context and gesture handling for its children.
 *
 * This component wraps its children with both the pan/zoom context provider and gesture handler,
 * enabling interactive pan and zoom functionality for the content area.
 *
 * @param props - PanZoomControlProps containing all pan/zoom configuration
 * @returns JSX element containing the pan/zoom-enabled content
 *
 * @example
 * ```tsx
 * <PanZoomControl width={400} height={300} contentSize={{width: 1000, height: 800}} />
 * ```
 */
export const PanZoomControl: React.FC<PanZoomControlProps> = (props) => {
  return (
    <PanZoomContextProvider {...props}>
      <PanZoomGestureHandler {...props}></PanZoomGestureHandler>
    </PanZoomContextProvider>
  );
};
