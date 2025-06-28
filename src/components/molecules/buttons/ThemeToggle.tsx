import React from 'react';
import { useThemeStore } from '@stores';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { IconButton } from '@atoms';

/**
 * ThemeToggle component that switches between light and dark themes.
 *
 * This component renders a button with a theme-appropriate icon that toggles
 * between light and dark themes when pressed. The icon and accessibility label
 * update dynamically based on the current theme state.
 *
 * @returns JSX element containing the theme toggle button
 *
 * @example
 * ```typescript
 * <ThemeToggle />
 * ```
 */
export const ThemeToggle: React.FC = () => {
  const {
    setTheme,
    theme: { dark },
  } = useThemeStore();

  const onThemeButtonPress = () => {
    setTheme(dark ? DefaultTheme : DarkTheme);
  };

  return (
    <IconButton
      icon={dark ? 'light-mode' : 'dark-mode'}
      onPress={onThemeButtonPress}
      accessibilityLabel={`Switch to ${dark ? 'light' : 'dark'} mode`}
      title=""
    />
  );
};
