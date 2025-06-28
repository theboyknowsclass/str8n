import { create } from 'zustand';
import { DefaultSourceImage, ImageSource } from '@types';

/**
 * Source image state interface that manages the state of the selected source image.
 * This state tracks the image URI, dimensions, metadata, loading state, and any errors.
 * @property sourceImage - The currently selected source image with URI, dimensions, and metadata
 * @property isLoading - Whether the image is currently loading
 * @property error - Error message if the image failed to load
 * @property setSourceImage - Sets the source image data
 * @property setLoading - Sets the loading state
 * @property setError - Sets the error message
 * @property clearImage - Clears all image state and resets to defaults
 */
type SourceImageState = {
  sourceImage: ImageSource;
  isLoading: boolean;
  error: string | null;
  setSourceImage: (sourceImage: ImageSource) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearImage: () => void;
};

/**
 * Zustand store for managing source image state.
 *
 * This store handles the state of the selected source image including
 * the image URI, dimensions, EXIF metadata, loading states, and error handling.
 * It provides methods to update the image data and manage the loading process.
 *
 * @example
 * ```typescript
 * const {
 *   sourceImage,
 *   isLoading,
 *   error,
 *   setSourceImage,
 *   setLoading,
 *   setError,
 *   clearImage
 * } = useSourceImageStore();
 *
 * // Load a new image
 * setLoading(true);
 * setError(null);
 * setSourceImage({
 *   uri: 'file://path/to/image.jpg',
 *   dimensions: { width: 1920, height: 1080 },
 *   tags: { /* EXIF data *\/ }
 * });
 * setLoading(false);
 *
 * // Handle error
 * setError('Failed to load image');
 * setLoading(false);
 *
 * // Clear image
 * clearImage();
 * ```
 */
export const useSourceImageStore = create<SourceImageState>()((set) => ({
  sourceImage: DefaultSourceImage,
  isLoading: false,
  error: null,
  setSourceImage: (sourceImage: ImageSource) => set({ sourceImage }),
  setLoading: (isLoading: boolean) => set({ isLoading }),
  setError: (error: string | null) => set({ error }),
  clearImage: () =>
    set({
      sourceImage: DefaultSourceImage,
      error: null,
    }),
}));
