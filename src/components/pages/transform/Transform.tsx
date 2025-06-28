import { LoadingSpinner, Text } from '@atoms';
import { useScreenDimensions, useTransformImage } from '@hooks';
import { ModalPageTemplate } from '@templates';
import { useTheme } from '@react-navigation/native';
import { useEffect } from 'react';
import { StyleSheet } from 'react-native';

/**
 * Transform page component that handles image transformation processing.
 *
 * This component displays a loading screen while the image transformation
 * is being processed. It automatically starts the transformation on mount
 * and provides a cancel option. The loading animation size is responsive
 * to screen dimensions.
 *
 * @returns JSX element containing the transformation loading screen
 *
 * @example
 * ```typescript
 * <Transform />
 * ```
 */
export const Transform: React.FC = () => {
  const { transformImage, cancel, isLoading } = useTransformImage();
  const { isLandscape, width, height } = useScreenDimensions();
  const { colors } = useTheme();
  const loadingAnimationSize = (isLandscape ? width : height) * 0.3;

  useEffect(
    () => {
      transformImage();
    },
    // we only want to call this on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <ModalPageTemplate title="Please wait..." onClose={cancel}>
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
