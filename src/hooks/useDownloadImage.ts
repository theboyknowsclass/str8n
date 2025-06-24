type DownloadImageHook = () => {
  downloadImage: (image: string, fileName: string) => Promise<void>;
  canDownload: boolean;
};

export const useDownloadImage: DownloadImageHook = () => {
  const downloadImage = async (image: string, fileName: string) => {
    console.warn('downloadImage', image, fileName);
  };

  return { downloadImage,
     canDownload: false };
};

export default useDownloadImage;
