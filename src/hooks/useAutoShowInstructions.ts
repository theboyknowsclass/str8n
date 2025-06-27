import { useEffect } from 'react';
import { usePersistedSettingsStore, useSessionStateStore } from '@stores';
import { usePageTemplateContext } from './usePageTemplateContext';
import { useNavigation } from '@hooks';

export const useAutoShowInstructions = () => {
  const { isReady } = usePageTemplateContext();
  const { hasDismissedInstructions } = useSessionStateStore();
  const { alwaysShowInstructions, isReady: isSettingsReady } =
    usePersistedSettingsStore();
  const { navigate } = useNavigation();

  useEffect(
    () => {
      if (
        isReady &&
        isSettingsReady &&
        alwaysShowInstructions &&
        !hasDismissedInstructions
      ) {
        navigate('instructions');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isReady, isSettingsReady] // only run when page is ready
  );
};
