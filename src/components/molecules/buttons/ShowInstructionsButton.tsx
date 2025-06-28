import { CircleTextButton } from '@atoms';
import { useNavigation } from '@hooks';

/**
 * ShowInstructionsButton component that displays user guidance.
 *
 * This component renders a circular button with a question mark that navigates
 * to the instructions page when pressed. It's used in the navigation bar
 * to provide quick access to help and guidance.
 *
 * @returns JSX element containing the show instructions button
 *
 * @example
 * ```typescript
 * <ShowInstructionsButton />
 * ```
 */
export const ShowInstructionsButton: React.FC = () => {
  const { navigate } = useNavigation();

  const onShowInstructionsPress = async () => {
    navigate('instructions');
  };

  return (
    <CircleTextButton
      key={'show-help'}
      accessibilityLabel={'Show instructions'}
      onPress={onShowInstructionsPress}
      disabled={false}
      title={'?'}
    />
  );
};
