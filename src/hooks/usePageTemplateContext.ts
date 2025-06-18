import { PageTemplateContext } from '@contexts/PageTemplateContext';
import { useContext } from 'react';

export const usePageTemplateContext = () => {
  const context = useContext(PageTemplateContext);
  if (context === undefined) {
    throw new Error(
      'usePageTemplateContext must be used within a PageTemplateContextProvider'
    );
  }
  return context;
};
