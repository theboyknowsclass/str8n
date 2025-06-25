import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ThemeProvider } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useSavedTheme, useSavedSettings } from '@hooks';

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
 * Root layout component that sets up the app's navigation drawer and theme handling.
 * This component wraps the entire app and provides theme context to all child components.
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
  const theme = useSavedTheme();
  useSavedSettings();

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
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
