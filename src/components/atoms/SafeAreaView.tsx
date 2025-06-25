import { View, StyleSheet, ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaViewProps extends ViewProps {
  children: React.ReactNode;
}

export const SafeAreaView: React.FC<SafeAreaViewProps> = ({
  children,
  style,
  ...rest
}) => {
  const insets = useSafeAreaInsets();

  const safeViewStyle = {
    paddingTop: Math.max(insets.top, 16),
    paddingBottom: Math.max(insets.bottom, 16),
    paddingLeft: Math.max(insets.left, 16),
    paddingRight: Math.max(insets.right, 16),
  };

  return (
    <View style={[styles.container, safeViewStyle, style]} {...rest}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
  },
});
