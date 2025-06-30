import {
  PanZoomGestureHandler,
  PanZoomGestureHandlerProps,
} from './PanZoomGestureHandler';
import {
  PanZoomContextProvider,
  PanZoomContextProviderProps,
} from '@contexts/PanZoomContext';

interface PanZoomControlProps
  extends PanZoomGestureHandlerProps,
    PanZoomContextProviderProps {}

export const PanZoomControl: React.FC<PanZoomControlProps> = (props) => {
  return (
    <PanZoomContextProvider {...props}>
      <PanZoomGestureHandler {...props}></PanZoomGestureHandler>
    </PanZoomContextProvider>
  );
};
