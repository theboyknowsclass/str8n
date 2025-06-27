import { create } from 'zustand';

/**
 * Transformed image state interface that manages the state of image transformation operations.
 * This state tracks the transformation process, results, and any errors that occur.
 * @property destinationUri - The URI of the successfully transformed image
 * @property isLoading - Whether an image transformation is currently in progress
 * @property error - Error message if the transformation failed
 * @property setDestinationUri - Sets the URI of the transformed image
 * @property setLoading - Sets the loading state during transformation
 * @property setError - Sets the error message if transformation fails
 * @property clearTransformedImage - Clears all transformed image state
 */
type TransformedImageState = {
  destinationUri: string | null;
  isLoading: boolean;
  error: string | null;
  setDestinationUri: (uri: string | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearTransformedImage: () => void;
};

/**
 * Zustand store for managing transformed image state.
 *
 * This store handles the state of image transformation operations including
 * loading states, success results, and error handling. It's used to track
 * the progress and results of image processing operations.
 *
 * @example
 * ```typescript
 * const {
 *   destinationUri,
 *   isLoading,
 *   error,
 *   setDestinationUri,
 *   setLoading,
 *   setError,
 *   clearTransformedImage
 * } = useTransformedImageStore();
 *
 * // Start transformation
 * setLoading(true);
 * setError(null);
 *
 * // Handle success
 * setDestinationUri('file://path/to/transformed.jpg');
 * setLoading(false);
 *
 * // Handle error
 * setError('Failed to transform image');
 * setLoading(false);
 *
 * // Clear state
 * clearTransformedImage();
 * ```
 */
export const useTransformedImageStore = create<TransformedImageState>()(
  (set) => ({
    destinationUri: null,
    isLoading: false,
    error: null,
    setDestinationUri: (destinationUri: string | null) =>
      set({ destinationUri }),
    setLoading: (isLoading: boolean) => set({ isLoading }),
    setError: (error: string | null) => set({ error }),
    clearTransformedImage: () =>
      set({
        destinationUri: null,
        isLoading: false,
        error: null,
      }),
  })
);
