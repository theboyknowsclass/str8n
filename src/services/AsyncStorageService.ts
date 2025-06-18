import { Theme } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersistedSettings } from '@types';

/**
 * The key used to store the theme in AsyncStorage.
 */
const THEME_KEY = 'theme';

/**
 * The key used to store the persisted settings in AsyncStorage.
 */
const SETTINGS_KEY = 'persisted_settings';

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
      console.error(e);
    }
  };
}
