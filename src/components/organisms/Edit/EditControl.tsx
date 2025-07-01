import { useEditControlContext } from '@contexts/EditControlContext';
import { PanZoomContextProvider } from '@contexts/PanZoomContext';
import { getEditControlParams } from '@utils/editControlUtils';
import { PanZoomGestureHandler } from './PanZoomGestureHandler';
import { SelectionControl } from './SelectionControl';

/**
 * Props for the EditControl component.
 * @property width - The width of the control area in pixels
 * @property height - The height of the control area in pixels
 */
export type EditControlProps = {
  width: number;
  height: number;
};

/**
 * EditControl component that provides pan/zoom and selection logic for image editing.
 *
 * This component sets up the pan/zoom context and selection controls for the editing interface.
 * It calculates initial scale, translation, and boundaries based on the image and container size.
 *
 * @param props - EditControlProps containing width and height of the editing area
 * @returns JSX element containing the editing controls
 *
 * @example
 * ```tsx
 * <EditControl width={400} height={300} />
 * ```
 */
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
