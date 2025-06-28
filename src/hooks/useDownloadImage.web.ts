import { saveAs } from 'file-saver';

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
 * Hook for downloading images in web environments.
 * Converts base64 images to downloadable files using the file-saver library.
 *
 * @returns UseDownloadImage object containing download functionality
 *
 * @example
 * ```typescript
 * const { downloadImage } = useDownloadImage();
 * await downloadImage(base64Image, 'transformed-image.jpg');
 * ```
 */
export const useDownloadImage = (): UseDownloadImage => {
  const convertBase64ToFile = (base64String: string, fileName: string) => {
    const arr = base64String.split(',');
    const mime = arr[0].match(/:(.*?);/)?.[1];
    const bstr = atob(arr[1]);
    const n = bstr.length;
    const uint8Array = new Uint8Array(n);
    for (let i = 0; i < n; i++) {
      uint8Array[i] = bstr.charCodeAt(i);
    }
    const file = new File([uint8Array], fileName, { type: mime });
    return file;
  };

  const downloadImage = async (image: string, fileName: string) => {
    const file = convertBase64ToFile(image, fileName);
    await saveAs(file, fileName);
    return;
  };

  return { downloadImage, canDownload: true };
};

export default useDownloadImage;
