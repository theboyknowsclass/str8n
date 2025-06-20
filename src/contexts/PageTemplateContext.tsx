import React, { createContext, useState, ReactNode } from 'react';
import { Dimensions } from '@types';

interface PageTemplateContextType {
  dimensions: Dimensions;
  isReady: boolean;
  setDimensions: (dimensions: Dimensions) => void;
  setIsReady: (isReady: boolean) => void;
}

export const PageTemplateContext = createContext<PageTemplateContextType>({
  dimensions: { width: 0, height: 0 },
  setDimensions: () => {},
  isReady: false,
  setIsReady: () => {},
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

  const value = {
    dimensions,
    isReady,
    setDimensions,
    setIsReady,
  };

  return (
    <PageTemplateContext.Provider value={value}>
      {children}
    </PageTemplateContext.Provider>
  );
};
