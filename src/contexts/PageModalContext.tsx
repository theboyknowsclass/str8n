import React, { createContext, useState, ReactNode } from 'react';

export interface PageModalContextType {
  isModalVisible: boolean;
  setIsModalVisible: (isModalVisible: boolean) => void;
}

export const PageModalContext = createContext<PageModalContextType>({
  isModalVisible: false,
  setIsModalVisible: () => {},
});

interface PageModalProviderProps {
  children: ReactNode;
}

export const PageModalContextProvider: React.FC<PageModalProviderProps> = ({
  children,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const value = {
    isModalVisible,
    setIsModalVisible,
  };

  return (
    <PageModalContext.Provider value={value}>
      {children}
    </PageModalContext.Provider>
  );
};
