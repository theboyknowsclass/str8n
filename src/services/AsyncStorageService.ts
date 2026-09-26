import { Theme } from 'expo-router/react-navigation';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedSettings, CalibrationSample } from '@types';

/**
 * The key used to store the theme in AsyncStorage.
 */
const THEME_KEY = 'theme';

/**
 * The key used to store the persisted settings in AsyncStorage.
 */
const SETTINGS_KEY = 'persisted_settings';

/**
 * The key used to store the detection-calibration samples in AsyncStorage.
 */
const CALIBRATION_SAMPLES_KEY = 'calibration_samples';

/**
 * The key used to store the batch-calibration screen's processed filenames
 * in AsyncStorage.
 */
const PROCESSED_CALIBRATION_FILENAMES_KEY = 'processed_calibration_filenames';

/**
 * Service for managing AsyncStorage operations.
 */
export class AsyncStorageService {
  /**
   * Retrieves the stored theme from AsyncStorage.
   * @returns The stored theme or undefined if no theme is found.
   */
  static getStoredTheme = async (): Promise<Theme | undefined> => {
    try {
      const jsonValue = await AsyncStorage.getItem(THEME_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : undefined;
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
      // error reading value
      return undefined;
    }
  };

  /**
   * Stores the theme in AsyncStorage.
   * @param theme The theme to store.
   */
  static storeTheme = async (theme: Theme) => {
    try {
      await AsyncStorage.setItem(THEME_KEY, JSON.stringify(theme));
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
    }
  };

  /**
   * Retrieves the stored persisted settings from AsyncStorage.
   * @returns The stored settings or undefined if no settings are found.
   */
  static getStoredSettings = async (): Promise<
    PersistedSettings | undefined
  > => {
    try {
      const jsonValue = await AsyncStorage.getItem(SETTINGS_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : undefined;
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
      // error reading value
      return undefined;
    }
  };

  /**
   * Stores the persisted settings in AsyncStorage.
   * @param settings The settings to store.
   */
  static storeSettings = async (settings: PersistedSettings) => {
    try {
      await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
    }
  };

  /**
   * Retrieves the saved detection-calibration samples from AsyncStorage.
   * @returns The stored samples, or an empty array if none are found.
   */
  static getCalibrationSamples = async (): Promise<CalibrationSample[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(CALIBRATION_SAMPLES_KEY);
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
      return [];
    }
  };

  /**
   * Stores the detection-calibration samples in AsyncStorage.
   * @param samples The samples to store.
   */
  static storeCalibrationSamples = async (samples: CalibrationSample[]) => {
    try {
      await AsyncStorage.setItem(
        CALIBRATION_SAMPLES_KEY,
        JSON.stringify(samples)
      );
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
    }
  };

  /**
   * Retrieves the filenames the batch calibration screen has already
   * processed (saved or explicitly skipped), so re-picking the same source
   * folder in a later session doesn't re-show them - a full batch of real
   * photos isn't expected to be processed in one sitting.
   * @returns The stored filenames, or an empty array if none are found.
   */
  static getProcessedCalibrationFilenames = async (): Promise<string[]> => {
    try {
      const jsonValue = await AsyncStorage.getItem(
        PROCESSED_CALIBRATION_FILENAMES_KEY
      );
      return jsonValue != null ? JSON.parse(jsonValue) : [];
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
      return [];
    }
  };

  /**
   * Stores the batch calibration screen's processed filenames in AsyncStorage.
   * @param filenames The filenames to store.
   */
  static storeProcessedCalibrationFilenames = async (filenames: string[]) => {
    try {
      await AsyncStorage.setItem(
        PROCESSED_CALIBRATION_FILENAMES_KEY,
        JSON.stringify(filenames)
      );
    } catch (e) {
      // swallow error, but log it for debugging
      console.error(e);
    }
  };
}
