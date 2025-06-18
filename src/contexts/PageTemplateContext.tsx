import React, { createContext, useState, ReactNode } from 'react';
import { Dimensions } from '@types';

interface PageTemplateContextType {
  dimensions: Dimensions;
  isReady: boolean;
  isModalVisible: boolean;
  setDimensions: (dimensions: Dimensions) => void;
  setIsReady: (isReady: boolean) => void;
  setIsModalVisible: (isModalVisible: boolean) => void;
}

export const PageTemplateContext = createContext<PageTemplateContextType>({
  dimensions: { width: 0, height: 0 },
  setDimensions: () => {},
  isReady: false,
  setIsReady: () => {},
  isModalVisible: false,
  setIsModalVisible: () => {},
});

interface PageTemplateProviderProps {
  children: ReactNode;
}

export const PageTemplateContextProvider: React.FC<
  PageTemplateProviderProps
> = ({ children }) => {
  const [dimensions, setDimensions] = useState<Dimensions>({
    width: 0,
    height: 0,
  });
  const [isReady, setIsReady] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const value = {
    dimensions,
    isReady,
    setDimensions,
    setIsReady,
    isModalVisible,
    setIsModalVisible,
  };

  return (
    <PageTemplateContext.Provider value={value}>
      {children}
    </PageTemplateContext.Provider>
  );
};
