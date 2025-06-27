import { Instructions } from '@organisms';
import { ModalPageTemplate } from '@templates';
import { InstructionMode } from '@types';
import { StyleSheet, View } from 'react-native';

interface InstructionsPageProps {
  mode: InstructionMode;
  showSteps: boolean;
}

export const InstructionsPage: React.FC<InstructionsPageProps> = ({
  mode,
  showSteps,
}) => {
  return (
    <ModalPageTemplate title="Instructions">
      {/* <View style={styles.instructionsContainer}> */}
      <Instructions mode={mode} showSteps={showSteps} />
      {/* </View> */}
    </ModalPageTemplate>
  );
};

const styles = StyleSheet.create({
  instructionsContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    width: '100%',
    height: '100%',
  },
});
