import {
  requestMediaLibraryPermissionsAsync,
  launchImageLibraryAsync,
} from 'expo-image-picker';
import { ImageSource, Result } from '@types';
import { ImageMetadataService } from './ImageMetadataService';

/**
 * Image picker service following the Single Responsibility Principle
 * This service is only responsible for handling image selection functionality
 */
export class ImagePickerService {
  /**
   * Request permissions for accessing the image library
   * @returns Promise resolving to a boolean indicating if permission was granted
   */
  static async requestPermissions(): Promise<boolean> {
    const { status } = await requestMediaLibraryPermissionsAsync();
    return status === 'granted';
  }

  /**
   * Open the device image library and select an image
   * @returns Promise resolving to Result<ImageSource>
   */
  static async selectImage(): Promise<Result<ImageSource>> {
    try {
      // Check for permissions first
      const permissionGranted = await this.requestPermissions();

      if (!permissionGranted) {
        return {
          data: null,
          success: false,
          error: 'Permission to access media library was denied',
        };
      }

      // Launch image library. base64 is intentionally omitted - nothing in
      // the app reads result.assets[0].base64 (only .uri, downstream), and
      // requesting it forces the picker to additionally base64-encode the
      // full-resolution image into a second in-memory copy for no benefit -
      // on web in particular, a real cost for a large modern phone photo.
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images', 'livePhotos'],
        allowsEditing: false,
        quality: 1,
      });

      // Handle user cancellation
      if (result.canceled) {
        return {
          data: null,
          success: false,
          error: 'Image selection was cancelled',
        };
      }

      const tags = await ImageMetadataService.getTags(result.assets[0].uri);

      // Return the selected image URI
      return {
        data: {
          uri: result.assets[0].uri,
          dimensions: {
            width: result.assets[0].width,
            height: result.assets[0].height,
          },
          tags: tags ?? null,
        },
        success: true,
      };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: `Failed to select image: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }

  /**
   * Open the device image library and select multiple images at once - used
   * by the dev-only BatchCalibration screen to process a whole folder of
   * real photos in one sitting, rather than picking one at a time.
   * @returns Promise resolving to Result<{image, fileName}[]> - fileName is
   * used by the batch screen to remember which photos have already been
   * processed across sessions (see useBatchCalibrationStore); it can be
   * null if the platform/permission level doesn't expose it.
   */
  static async selectImages(): Promise<
    Result<{ image: ImageSource; fileName: string | null }[]>
  > {
    try {
      const permissionGranted = await this.requestPermissions();

      if (!permissionGranted) {
        return {
          data: null,
          success: false,
          error: 'Permission to access media library was denied',
        };
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: false,
        allowsMultipleSelection: true,
        selectionLimit: 0,
        quality: 1,
      });

      if (result.canceled) {
        return {
          data: null,
          success: false,
          error: 'Image selection was cancelled',
        };
      }

      const images = await Promise.all(
        result.assets.map(async (asset) => {
          const tags = await ImageMetadataService.getTags(asset.uri);
          return {
            image: {
              uri: asset.uri,
              dimensions: { width: asset.width, height: asset.height },
              tags: tags ?? null,
            },
            fileName: asset.fileName ?? null,
          };
        })
      );

      return { data: images, success: true };
    } catch (error) {
      return {
        data: null,
        success: false,
        error: `Failed to select images: ${
          error instanceof Error ? error.message : String(error)
        }`,
      };
    }
  }
}
