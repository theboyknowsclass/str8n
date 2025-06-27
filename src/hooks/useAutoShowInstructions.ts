import { useEffect } from 'react';
import { usePageModalContext } from './usePageModalContext';
import { usePersistedSettingsStore, useSessionStateStore } from '@stores';
import { usePageTemplateContext } from './usePageTemplateContext';

export const useAutoShowInstructions = () => {
  const { isReady } = usePageTemplateContext();
  const { setIsModalVisible, isModalVisible } = usePageModalContext();
  const { hasDismissedInstructions } = useSessionStateStore();
  const { alwaysShowInstructions, isReady: isSettingsReady } =
    usePersistedSettingsStore();

  useEffect(
    () => {
      if (
        isReady &&
        isSettingsReady &&
        !isModalVisible &&
        alwaysShowInstructions &&
        !hasDismissedInstructions
      ) {
        setIsModalVisible(true);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isReady, isSettingsReady] // only run when page is ready
  );
};
