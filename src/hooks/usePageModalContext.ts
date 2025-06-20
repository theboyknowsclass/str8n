import { PageModalContext } from '@contexts/PageModalContext';
import { useContext } from 'react';

export const usePageModalContext = () => {
  const context = useContext(PageModalContext);
  if (context === undefined) {
    throw new Error(
      'usePageModalContext must be used within a PageModalContextProvider'
    );
  }
  return context;
};
