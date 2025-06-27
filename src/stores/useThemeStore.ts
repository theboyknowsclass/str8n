import { DefaultTheme, Theme } from '@react-navigation/native';
import { create } from 'zustand';
import { AsyncStorageService } from '@services';

/**
 * Represents the state of the theme store.
 * @property theme - The current theme
 * @property setTheme - Function to set the theme
 * @property isReady - Indicates whether the theme is ready
 * @property setIsReady - Function to set the isReady state
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
 * Creates the theme store using the Zustand library.
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

const overridePrimaryColour = (theme: Theme, primaryColor: string) => {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      primary: primaryColor,
    },
  };
};
