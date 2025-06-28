import React, { createContext, useState, ReactNode } from 'react';

/**
 * Context type for page modal functionality.
 * Provides modal visibility state management across components.
 * @property isModalVisible - Boolean indicating if a modal is currently visible
 * @property setIsModalVisible - Function to update the modal visibility state
 */
export interface PageModalContextType {
  isModalVisible: boolean;
  setIsModalVisible: (isModalVisible: boolean) => void;
}

/**
 * React context for page modal functionality.
 * Provides shared state for modal visibility across components.
 */
export const PageModalContext = createContext<PageModalContextType>({
  isModalVisible: false,
  setIsModalVisible: () => {},
});

/**
 * Props for the PageModalContextProvider component.
 * @property children - React nodes to be wrapped by the provider
 */
interface PageModalProviderProps {
  children: ReactNode;
}

/**
 * Provider component for page modal functionality.
 * Manages modal visibility state, providing it to child components.
 *
 * @param props - PageModalProviderProps containing children
 * @returns PageModalContext.Provider wrapping the children
 *
 * @example
 * ```typescript
 * <PageModalContextProvider>
 *   <ModalComponent />
 * </PageModalContextProvider>
 * ```
 */
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
