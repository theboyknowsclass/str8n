import { useEffect } from 'react';
import { usePageModalContext } from './usePageModalContext';
import { usePersistedSettingsStore, useSessionStateStore } from '@stores';

export const useAutoShowInstructions = () => {
  const { setIsModalVisible, isModalVisible } = usePageModalContext();
  const { hasDismissedInstructions } = useSessionStateStore();
  const { alwaysShowInstructions } = usePersistedSettingsStore();

  useEffect(
    () => {
      if (
        !isModalVisible &&
        alwaysShowInstructions &&
        !hasDismissedInstructions
      ) {
        setTimeout(() => {
          setIsModalVisible(true);
        }, 1500);
      }

      return () => {
        setIsModalVisible(false);
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [] // only run once on mount
  );
};
