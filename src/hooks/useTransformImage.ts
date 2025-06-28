import {
  useSourceImageStore,
  useTransformedImageStore,
  useOverlayStore,
  usePersistedSettingsStore,
} from '@stores';
import {
  getAbsolutePoints,
  getLargestRectangle,
  getPoints,
  orderPointsByCorner,
} from '@utils/overlayUtils';
import { TransformService } from '@services';
import { useRef } from 'react';
import { useNavigation } from './useNavigation';

type TransformImageHook = () => {
  transformImage: () => Promise<void>;
  cancel: () => void;
  isLoading: boolean;
  error: string | null;
};

export const useTransformImage: TransformImageHook = () => {
  const { sourceImage } = useSourceImageStore();
  const { setDestinationUri, setLoading, setError, isLoading, error } =
    useTransformedImageStore();
  const { points: selectedOverlay } = useOverlayStore();
  const { cropToOverlay } = usePersistedSettingsStore();
  const { dismiss, navigate } = useNavigation();
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setLoading(false);
      setError('Image transformation cancelled');
    }
  };

  const transformImage = async () => {
    if (!sourceImage) return;

    const { dimensions } = sourceImage;

    try {
      setLoading(true);
      setError(null);
      abortControllerRef.current = new AbortController();

      const { width, height } = dimensions;

      if (width === 0 || height === 0) {
        throw new Error('Image dimensions are invalid');
      }

      // Convert relative points to absolute coordinates
      const absolutePoints = getAbsolutePoints(
        selectedOverlay,
        dimensions.width,
        dimensions.height
      );

      // Order points to ensure proper perspective transformation
      const srcPoints = orderPointsByCorner(absolutePoints);

      // Find the largest rectangle within the selected points
      const largestRect = getLargestRectangle(srcPoints);
      const dstPoints = getPoints(largestRect);

      // Perform the actual image transformation
      const transformedUri = await TransformService.transformImage(
        sourceImage,
        srcPoints,
        dstPoints,
        cropToOverlay,
        abortControllerRef.current.signal
      );

      if (abortControllerRef.current.signal.aborted) {
        return;
      }

      setDestinationUri(transformedUri);
      dismiss();
      navigate('export');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Image transformation cancelled');
      } else {
        setError(
          `Error processing image: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    } finally {
      abortControllerRef.current = null;
      setLoading(false);
    }
  };

  return {
    transformImage,
    cancel,
    isLoading,
    error,
  };
};
