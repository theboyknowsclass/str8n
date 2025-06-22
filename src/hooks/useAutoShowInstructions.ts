import { useEffect } from 'react';
import { usePageModalContext } from './usePageModalContext';
import { usePersistedSettingsStore, useSessionStateStore } from '@stores';
import { usePageTemplateContext } from './usePageTemplateContext';

export const useAutoShowInstructions = () => {
  const { isReady } = usePageTemplateContext();
  const { setIsModalVisible, isModalVisible } = usePageModalContext();
  const { hasDismissedInstructions } = useSessionStateStore();
  const { alwaysShowInstructions } = usePersistedSettingsStore();

  useEffect(
    () => {
      if (
        isReady &&
        !isModalVisible &&
        alwaysShowInstructions &&
        !hasDismissedInstructions
      ) {
        setIsModalVisible(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isReady] // only run when page is ready
  );
};
