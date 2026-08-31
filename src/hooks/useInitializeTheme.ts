import { useEffect } from 'react';
import { useThemeStore } from '@stores';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme, Theme } from 'expo-router/react-navigation';
import { AsyncStorageService } from '@services';

/**
 * Return type for the useInitializeTheme hook.
 * @property theme - The current theme object
 * @property isReady - Boolean indicating if theme initialization is complete
 */
type UseInitializeTheme = {
  theme: Theme;
  isReady: boolean;
};

/**
 * Hook for initializing the application theme from storage or system default.
 * Loads the stored theme from AsyncStorage or falls back to system color scheme.
 *
 * @returns UseInitializeTheme object containing theme and ready state
 *
 * @example
 * ```typescript
 * const { theme, isReady } = useInitializeTheme();
 * ```
 */
export const useInitializeTheme = (): UseInitializeTheme => {
  const colorScheme = useColorScheme();
  const { theme, setTheme, setIsReady, isReady } = useThemeStore();

  useEffect(() => {
    const loadInitialData = async () => {
      const storedTheme = await AsyncStorageService.getStoredTheme();

      // If stored theme, use it
      if (storedTheme) {
        setTheme(storedTheme);
      } else {
        // If no stored theme, use system default
        if (colorScheme === 'dark') {
          setTheme(DarkTheme);
        } else {
          setTheme(DefaultTheme);
        }
      }
      setIsReady(true);
    };

    loadInitialData();

    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { theme, isReady };
};
