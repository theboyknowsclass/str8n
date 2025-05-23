import { TextButton } from '@atoms';
import { StyleSheet } from 'react-native';
import { router } from 'expo-router';

export const TransformImageButton: React.FC = () => {
  const onTransformImagePress = async () => {
    router.push('/transform');
  };

  return (
    <TextButton
      key={'transform-image'}
      accessibilityLabel={'Go'}
      onPress={onTransformImagePress}
      disabled={false}
      title={'Go'}
      variant="outline"
      style={styles.button}
      size="medium"
      textStyle={styles.text}
    />
  );
};

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    paddingVertical: 0,
    paddingHorizontal: 0,
    borderWidth: 2,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 22,
    fontFamily: 'Orbitron_700Bold',
  },
});
