import { Platform } from 'react-native';

/**
 * Persists the actual photo bytes behind a web calibration sample, so they
 * survive a page reload - web-only, and a separate concern from
 * CalibrationSampleService (which saves a sample's points/features/etc. to
 * AsyncStorage/localStorage). That metadata already survives a reload fine;
 * what doesn't is a sample's `imageUri` itself, which on web is just the
 * original picker `blob:` URL (browsers give no way to make a real
 * permanent copy - see FileSystemService.copyToPermanentStorage's docs) and
 * dies the moment the tab reloads or closes, since a `blob:` URL is only a
 * live reference into that page load's own in-memory registry, not
 * something a browser can persist across reloads on its own.
 *
 * Uses IndexedDB rather than `localStorage` for the actual bytes:
 * `localStorage` has a strict handful-of-megabytes quota per origin, which
 * a single real photo from a modern phone (20MP+, several megabytes) can
 * approach on its own - IndexedDB has a much larger quota and can store a
 * `Blob` directly, with no base64 encoding overhead.
 *
 * Native has no equivalent need: FileSystemService.copyToPermanentStorage
 * already gives native samples a real, durable `file://` URI, so this
 * service is never called there.
 */
export class CalibrationPhotoStorageService {
  private static readonly DATABASE_NAME = 'str8n-calibration-photos';
  private static readonly OBJECT_STORE_NAME = 'photos';
  private static readonly DATABASE_VERSION = 1;

  private static openDatabase(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DATABASE_NAME, this.DATABASE_VERSION);
      request.onupgradeneeded = () => {
        request.result.createObjectStore(this.OBJECT_STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Stores a calibration sample's photo, keyed by its sample id. Overwrites
   * any photo already stored under that id.
   */
  static async savePhoto(sampleId: string, photo: Blob): Promise<void> {
    if (Platform.OS !== 'web') {
      return;
    }
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        this.OBJECT_STORE_NAME,
        'readwrite'
      );
      transaction.objectStore(this.OBJECT_STORE_NAME).put(photo, sampleId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }

  /**
   * Loads a calibration sample's stored photo and hands back a fresh
   * `blob:` URL for it, usable for the rest of the current page load - not
   * something to persist and reuse later, since it's only valid until the
   * next reload (same lifetime rule as the original picker URL it
   * replaces). Resolves to null if nothing is stored under that id (e.g. a
   * sample saved before this storage existed).
   */
  static async loadPhotoUrl(sampleId: string): Promise<string | null> {
    if (Platform.OS !== 'web') {
      return null;
    }
    const database = await this.openDatabase();
    const photo = await new Promise<Blob | undefined>((resolve, reject) => {
      const transaction = database.transaction(
        this.OBJECT_STORE_NAME,
        'readonly'
      );
      const request = transaction
        .objectStore(this.OBJECT_STORE_NAME)
        .get(sampleId);
      request.onsuccess = () => resolve(request.result as Blob | undefined);
      request.onerror = () => reject(request.error);
    });
    return photo ? URL.createObjectURL(photo) : null;
  }

  /**
   * Deletes a calibration sample's stored photo - called whenever the
   * sample itself is deleted, so removing a sample doesn't leave its photo
   * bytes behind indefinitely.
   */
  static async deletePhoto(sampleId: string): Promise<void> {
    if (Platform.OS !== 'web') {
      return;
    }
    const database = await this.openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = database.transaction(
        this.OBJECT_STORE_NAME,
        'readwrite'
      );
      transaction.objectStore(this.OBJECT_STORE_NAME).delete(sampleId);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
  }
}
