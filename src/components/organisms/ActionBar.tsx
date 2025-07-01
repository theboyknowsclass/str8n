import { StyleSheet, View, ViewStyle } from 'react-native';

export interface ActionBarProps {
  isLandscape: boolean;
  children: React.ReactNode;
}

/**
 * ActionBar component that provides a flexible container for action buttons.
 *
 * This component adapts its layout based on device orientation, switching
 * between row and column layouts for optimal user experience in portrait
 * and landscape modes.
 *
 * @param isLandscape - Boolean indicating if the device is in landscape mode
 * @param children - React nodes to be rendered inside the action bar
 * @returns JSX element containing the action bar with flexible layout
 *
 * @example
 * ```typescript
 * <ActionBar isLandscape={false}>
 *   <Button title="Action 1" />
 *   <Button title="Action 2" />
 * </ActionBar>
 * ```
 */
export const ActionBar: React.FC<ActionBarProps> = ({
  isLandscape,
  children,
}) => {
  const actionBarStyles = [
    styles.actionBarBase,
    {
      flexDirection: isLandscape ? 'column' : 'row',
      paddingTop: isLandscape ? 0 : 16,
      paddingLeft: isLandscape ? 16 : 0,
    } as ViewStyle,
  ];

  return <View style={actionBarStyles}>{children}</View>;
};

const styles = StyleSheet.create({
  actionBarBase: {
    display: 'flex',
    flexGrow: 0,
    justifyContent: 'space-evenly',
  },
});
