import { useOverlayStore, useSourceImageStore } from '@stores';
import { Point } from '@types';
import { createContext, useMemo } from 'react';
import { makeMutable, SharedValue } from 'react-native-reanimated';

interface EditContextType {
  absolutePoints: SharedValue<Point>[];
}

export const EditContext = createContext<EditContextType>({
  absolutePoints: [],
} as EditContextType);

interface EditProviderProps {
  children: React.ReactNode;
}

export const EditProvider: React.FC<EditProviderProps> = ({ children }) => {
  const {
    sourceImage: {
      dimensions: { width, height },
    },
  } = useSourceImageStore();
  const points = useOverlayStore((state) => state.points);

  const absolutePoints = useMemo(() => {
    return points.map((p) =>
      makeMutable({
        x: p.x * width,
        y: p.y * height,
      })
    );
  }, [points, width, height]);

  const value = {
    absolutePoints,
  };

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
};
