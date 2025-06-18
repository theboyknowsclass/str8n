import { ExifTags, readAsync } from '@lodev09/react-native-exify';

export class ImageMetadataService {
  static async getTags(uri: string): Promise<ExifTags | undefined> {
    return await readAsync(uri);
  }
}
