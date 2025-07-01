import { useEditControlContext } from '@contexts/EditControlContext';
import { PanZoomContextProvider } from '@contexts/PanZoomContext';
import { getEditControlParams } from '@utils/editControlUtils';
import { PanZoomGestureHandler } from './PanZoomGestureHandler';
import { SelectionControl } from './SelectionControl';

export type EditControlProps = {
  width: number;
  height: number;
};

export const EditControl: React.FC<EditControlProps> = ({ width, height }) => {
  const {
    imageSize: { width: imageWidth, height: imageHeight },
  } = useEditControlContext();

  const {
    imageWithBorderSize,
    initialScale,
    minScale,
    maxScale,
    initialTranslate,
  } = getEditControlParams(width, height, imageWidth, imageHeight);

  return (
    <PanZoomContextProvider
      initialScale={initialScale}
      initialTranslate={initialTranslate}
      minScale={minScale}
      maxScale={maxScale}
      contentSize={imageWithBorderSize}
    >
      <PanZoomGestureHandler width={width} height={height}>
        <SelectionControl width={width} height={height} />
      </PanZoomGestureHandler>
    </PanZoomContextProvider>
  );
};
