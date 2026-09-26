import * as FileSystem from 'expo-file-system/legacy';
import { cleanBase64 } from '@utils/imageUtils';

/**
 * FileSystemService provides methods for reading and writing images to the file system.
 * This service is responsible for:
 * 1. Reading an image from a URI and returning its base64 representation
 * 2. Saving an image from a base64 string to the file system
 * 3. Managing temporary files in the cache directory
 */
export class FileSystemService {
  /**
   * Gets the cache directory path
   * @returns The path to the cache directory
   */
  static getCacheDirectory(): string {
    if (!FileSystem.cacheDirectory) {
      throw new Error('Cache directory is not available');
    }
    return FileSystem.cacheDirectory;
  }

  /**
   * Reads an image from a URI and returns its base64 representation
   * @param uri - The URI of the image to read
   * @returns Promise resolving to the base64 representation of the image
   */
  static async getImageAsBase64(uri: string) {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    return base64;
  }

  /**
   * Writes a base64 string to a specific file path
   * @param filePath - The path where the file should be written
   * @param base64 - The base64 string to write
   */
  static async writeBase64ToFile(
    filePath: string,
    base64: string
  ): Promise<void> {
    const cleanBase64String = cleanBase64(base64);
    await FileSystem.writeAsStringAsync(filePath, cleanBase64String, {
      encoding: FileSystem.EncodingType.Base64,
    });
  }

  /**
   * Deletes a file from the file system
   * @param filePath - The path of the file to delete
   */
  static async deleteFile(filePath: string): Promise<void> {
    await FileSystem.deleteAsync(filePath);
  }

  /**
   * Copies an image into a permanent app-owned directory, returning its new
   * URI. Used for calibration ground-truth samples: the image picker's own
   * URI is often a temporary cache path (particularly on iOS) that isn't
   * guaranteed to survive an app restart, so samples need their own stable
   * copy to be usable in a later calibration sweep.
   *
   * On web there's no document directory to copy into at all (browser
   * sandboxing) - the source URI is returned unchanged instead of throwing.
   * On web the picker's URI is already a `blob:` URL, which is a perfectly
   * usable reference for a same-browser-session calibration workflow (the
   * actual use case this session found for web calibration: it just won't
   * survive a page reload, unlike the real permanent copy native gets).
   * @param sourceUri - The URI of the image to copy (e.g. from the picker)
   * @param filename - The filename to give the copy (e.g. `${id}.jpg`)
   * @returns The new, permanent URI of the copied image (or the original
   * URI unchanged on web)
   */
  static async copyToPermanentStorage(
    sourceUri: string,
    filename: string
  ): Promise<string> {
    if (!FileSystem.documentDirectory) {
      return sourceUri;
    }

    const directory = `${FileSystem.documentDirectory}calibration/`;
    const directoryInfo = await FileSystem.getInfoAsync(directory);
    if (!directoryInfo.exists) {
      await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
    }

    const destinationUri = `${directory}${filename}`;
    await FileSystem.copyAsync({ from: sourceUri, to: destinationUri });
    return destinationUri;
  }
}
