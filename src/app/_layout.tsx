import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useInitializeTheme, useInitializeSettings } from '@hooks';

import {
  Orbitron_400Regular,
  Orbitron_500Medium,
  Orbitron_600SemiBold,
  Orbitron_700Bold,
  Orbitron_800ExtraBold,
  Orbitron_900Black,
  useFonts as expoUseFonts,
} from '@expo-google-fonts/orbitron';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Stack } from 'expo-router';

SplashScreen.preventAutoHideAsync();

/**
 * RootLayout component that sets up the app's navigation and theme handling.
 *
 * This component serves as the root layout for the entire application, providing
 * essential providers and configuration. It handles font loading, theme initialization,
 * settings initialization, and splash screen management. The component only renders
 * the app content when all initialization is complete.
 *
 * Features:
 * - Font loading with Orbitron font family
 * - Theme provider setup
 * - Safe area provider for device compatibility
 * - Gesture handler root for touch interactions
 * - Navigation stack configuration
 * - Splash screen management
 *
 * @returns JSX element containing the root layout or null during initialization
 *
 * @example
 * ```typescript
 * export default RootLayout;
 * ```
 */
export const RootLayout = () => {
  const [loaded, error] = expoUseFonts({
    Orbitron_400Regular,
    Orbitron_500Medium,
    Orbitron_600SemiBold,
    Orbitron_700Bold,
    Orbitron_800ExtraBold,
    Orbitron_900Black,
  });
  const { theme, isReady: isThemeReady } = useInitializeTheme();
  const isSettingsReady = useInitializeSettings();

  useEffect(() => {
    // If the fonts are loaded, the theme is ready, and the settings are ready, hide the splash screen
    if (loaded && !error && isThemeReady && isSettingsReady) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error, isThemeReady, isSettingsReady]);

  // If the fonts are not loaded, the theme is not ready, or the settings are not ready don't render anything
  if (!loaded || error || !isThemeReady || !isSettingsReady) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={theme}>
        {/* GestureHandlerRootView is required for gesture handling in React Native */}
        <GestureHandlerRootView style={styles.container}>
          <Stack>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="edit" options={{ headerShown: false }} />
            <Stack.Screen name="export" options={{ headerShown: false }} />
            <Stack.Screen
              name="settings"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="transform"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
            <Stack.Screen
              name="instructions"
              options={{ headerShown: false, presentation: 'fullScreenModal' }}
            />
          </Stack>
        </GestureHandlerRootView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
};

export default RootLayout;

// Styles for the layout components
const styles = StyleSheet.create({
  container: {
    flex: 1,
    borderWidth: 0,
  },
});
