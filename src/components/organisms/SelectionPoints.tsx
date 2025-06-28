import { TouchPoint } from '../molecules/TouchPoint';
import { View, StyleSheet } from 'react-native';
import { useEditContext } from '@hooks';

export const SelectionPoints: React.FC = () => {
  const { absolutePoints } = useEditContext();
  return (
    <View style={styles.container}>
      <View style={styles.pointsContainer}>
        {absolutePoints.map((_, index) => (
          <TouchPoint
            key={index}
            index={index}
            position={absolutePoints[index]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    width: '100%',
    height: '100%',
  },
  pointsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 2,
    width: '100%',
    height: '100%',
  },
});
