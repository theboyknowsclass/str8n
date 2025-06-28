/**
 * Return type for the useDownloadImage hook.
 * @property downloadImage - Function to download an image as a file
 * @property canDownload - Boolean indicating if download functionality is available
 */
type UseDownloadImage = {
  downloadImage: (image: string, fileName: string) => Promise<void>;
  canDownload: boolean;
};

/**
 * Hook for downloading images in native environments.
 * Currently a placeholder implementation that logs to console.
 *
 * @returns UseDownloadImage object containing download functionality
 *
 * @example
 * ```typescript
 * const { downloadImage, canDownload } = useDownloadImage();
 * if (canDownload) {
 *   await downloadImage(base64Image, 'transformed-image.jpg');
 * }
 * ```
 */
export const useDownloadImage = (): UseDownloadImage => {
  const downloadImage = async (image: string, fileName: string) => {
    console.warn('downloadImage', image, fileName);
  };

  return { downloadImage, canDownload: false };
};

export default useDownloadImage;
