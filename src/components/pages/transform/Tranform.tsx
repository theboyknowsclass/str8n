import { ProgressWheel, Text } from '@atoms';
import { useScreenDimensions, useTransformImage } from '@hooks';
import { CloseButton } from '@molecules';
import { useTheme } from '@react-navigation/native';
import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

export const Transform: React.FC = () => {
  const { transformImage, cancel, isLoading } = useTransformImage();
  const { isLandscape, width, height } = useScreenDimensions();
  const { colors } = useTheme();
  const loadingAnimationSize = (isLandscape ? width : height) * 0.3;

  useEffect(() => {
    transformImage();
  }, [transformImage]);

  return (
    <View style={styles.container}>
      <View style={styles.closeButtonContainer}>
        <CloseButton onPress={cancel} />
      </View>
      <View style={styles.content}>
        <ProgressWheel
          size={loadingAnimationSize}
          progress={undefined}
          animating={isLoading}
        />
        <Text style={styles.text} size="large" color={colors.primary}>
          Reticulating splines...
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: '100%',
    width: '100%',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    verticalAlign: 'middle',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 1000,
  },
  text: {
    marginTop: 24,
  },
});
