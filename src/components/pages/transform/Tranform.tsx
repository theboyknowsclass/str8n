import { LoadingSpinner, Text } from '@atoms';
import { useScreenDimensions, useTransformImage } from '@hooks';
import { ModalPageTemplate } from '@templates';
import { useTheme } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

export const Transform: React.FC = () => {
  const { transformImage, cancel, isLoading } = useTransformImage();
  const { isLandscape, width, height } = useScreenDimensions();
  const { colors } = useTheme();
  const loadingAnimationSize = (isLandscape ? width : height) * 0.3;

  useEffect(() => {
    transformImage();
  }, [transformImage]);

  return (
    <ModalPageTemplate onClose={cancel}>
      <LoadingSpinner size={loadingAnimationSize} animating={isLoading} />
      <Text style={styles.text} size="large" color={colors.primary}>
        Reticulating splines...
      </Text>
    </ModalPageTemplate>
  );
};

const styles = StyleSheet.create({
  text: {
    marginTop: 24,
  },
});
