import { DefaultTheme, Theme } from 'expo-router/react-navigation';
import { create } from 'zustand';
import { AsyncStorageService } from '@services';

/**
 * Theme state interface that manages the app's visual theme and primary color.
 * This state is automatically saved to AsyncStorage and persists between app launches.
 * @property theme - The current React Navigation theme object
 * @property primaryColor - The primary color used throughout the app
 * @property setTheme - Sets the theme and saves it to storage
 * @property setPrimaryColor - Sets the primary color and updates the theme
 * @property isReady - Whether the theme has been loaded from storage
 * @property setIsReady - Sets the ready state of the theme
 */
interface ThemeState {
  theme: Theme;
  primaryColor: string;
  setTheme: (theme: Theme) => void;
  setPrimaryColor: (color: string) => void;
  isReady: boolean;
  setIsReady: (isReady: boolean) => void;
}

/**
 * Zustand store for managing the app's theme and color scheme.
 *
 * This store handles the visual theme configuration including the primary color
 * and React Navigation theme. The theme is automatically saved to AsyncStorage
 * and restored when the app launches.
 *
 * @example
 * ```typescript
 * const {
 *   theme,
 *   setTheme,
 *   primaryColor,
 *   setPrimaryColor
 * } = useThemeStore();
 *
 * // Change primary color
 * setPrimaryColor('#FF5722');
 *
 * // Switch to dark theme
 * setTheme(DarkTheme);
 * ```
 */
export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: DefaultTheme,
  primaryColor: '#00BCD4',
  isReady: false,
  setIsReady: (isReady: boolean) => set({ isReady }),
  setTheme: (theme: Theme) => {
    const themeWithPrimaryColor = overridePrimaryColour(
      theme,
      get().primaryColor
    );
    AsyncStorageService.storeTheme(themeWithPrimaryColor);
    set({ theme: themeWithPrimaryColor });
  },
  setPrimaryColor: (color: string) => {
    set({ primaryColor: color });
    const themeWithPrimaryColor = overridePrimaryColour(get().theme, color);
    AsyncStorageService.storeTheme(themeWithPrimaryColor);
    set({ theme: themeWithPrimaryColor });
  },
}));

/**
 * Helper function to override the primary color in a theme object.
 *
 * @param theme - The base theme to modify
 * @param primaryColor - The new primary color to apply
 * @returns A new theme object with the updated primary color
 */
const overridePrimaryColour = (theme: Theme, primaryColor: string) => {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary: primaryColor,
    },
  };
};
