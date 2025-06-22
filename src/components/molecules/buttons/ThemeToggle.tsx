import React from 'react';
import { useThemeStore } from '@stores';
import { DarkTheme, DefaultTheme } from '@react-navigation/native';
import { IconButton } from '@atoms';

/**
 * A toggle button component that switches between light and dark themes.
 * Uses the Button component with an icon variant for consistent styling.
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
