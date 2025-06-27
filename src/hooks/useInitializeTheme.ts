import { useEffect } from 'react';
import { useThemeStore } from '@stores';
import { useColorScheme } from 'react-native';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { AsyncStorageService } from '@services';

/**
 * Custom hook for initializing the application theme from storage or system default.
 * Returns { theme, isReady }.
 */
export const useInitializeTheme = () => {
  const colorScheme = useColorScheme();
  const { theme, setTheme, setIsReady, isReady } = useThemeStore();

  useEffect(() => {
    const loadInitialData = async () => {
      const storedTheme = await AsyncStorageService.getStoredTheme();
      if (storedTheme) {
        setTheme(storedTheme);
        setIsReady(true);
        return;
      }

      if (colorScheme === 'dark') {
        setTheme(DarkTheme);
      } else {
        setTheme(DefaultTheme);
      }
      setIsReady(true);
    };

    loadInitialData();
    // disable reacting to colorScheme changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setTheme, setIsReady]);

  return { theme, isReady };
};
