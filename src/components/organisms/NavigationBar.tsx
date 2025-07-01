import {
  BackButton,
  SettingsButton,
  ShowInstructionsButton,
  ThemeToggle,
} from '@molecules';
import { View, StyleSheet, ViewStyle } from 'react-native';

/**
 * NavigationBar component that provides app-wide navigation controls.
 *
 * This component displays navigation buttons including back, settings,
 * instructions, and theme toggle. The layout adapts to landscape/portrait
 * orientation for optimal user experience.
 *
 * @param isLandscape - Boolean indicating if the device is in landscape mode
 * @returns JSX element containing the navigation bar with action buttons
 *
 * @example
 * ```typescript
 * <NavigationBar isLandscape={true} />
 * ```
 */
export const NavigationBar: React.FC<{ isLandscape: boolean }> = ({
  isLandscape,
}) => {
  const navigationBarStyles = [
    styles.navigationBarBase,
    getNavigationBarStyles(isLandscape),
  ];

  const navigationBarPrimaryStyles = [
    styles.navigationBarPrimary,
    getNavigationBarStyles(isLandscape),
  ];

  const navigationBarSecondaryStyles = [
    styles.navigationBarSecondary,
    getNavigationBarStyles(isLandscape),
  ];

  return (
    <View style={navigationBarStyles}>
      <View style={navigationBarPrimaryStyles}>
        <BackButton />
      </View>
      <View style={navigationBarSecondaryStyles}>
        <ShowInstructionsButton />
        <ThemeToggle />
        <SettingsButton />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navigationBarBase: {
    display: 'flex',
    flexGrow: 0,
    gap: 16,
  },
  navigationBarPrimary: {
    flexGrow: 1,
    gap: 16,
  },
  navigationBarSecondary: {
    display: 'flex',
    flexGrow: 0,
    gap: 16,
  },
});

/**
 * Helper function to get navigation bar styles based on orientation.
 *
 * @param isLandscape - Boolean indicating if the device is in landscape mode
 * @returns ViewStyle object with appropriate flexDirection and padding
 */
const getNavigationBarStyles = (isLandscape: boolean): ViewStyle => {
  return {
    flexDirection: isLandscape ? 'column' : 'row',
    paddingBottom: isLandscape ? 0 : 16,
    paddingRight: isLandscape ? 16 : 0,
  };
};
