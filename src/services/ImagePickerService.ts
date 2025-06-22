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

      // Launch image library
      const result = await launchImageLibraryAsync({
        mediaTypes: ['images', 'livePhotos'],
        allowsEditing: false,
        quality: 1,
        base64: true,
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
}
