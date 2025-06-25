import { saveAs } from 'file-saver';

type DownloadImageHook = () => {
  downloadImage: (image: string, fileName: string) => Promise<void>;
  canDownload: boolean;
};

export const useDownloadImage: DownloadImageHook = () => {
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
