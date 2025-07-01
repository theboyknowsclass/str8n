import { SharedValue } from 'react-native-reanimated';

export type MovablePoint = {
  x: SharedValue<number>;
  y: SharedValue<number>;
  isActive: SharedValue<boolean>;
  absoluteX: SharedValue<number>;
  absoluteY: SharedValue<number>;
};
