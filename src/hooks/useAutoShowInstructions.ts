import { useEffect } from 'react';
import { usePersistedSettingsStore, useSessionStateStore } from '@stores';
import { usePageTemplateContext } from './usePageTemplateContext';
import { useNavigation } from '@hooks';

/**
 * Hook that automatically shows instructions when certain conditions are met.
 * Checks if instructions should be shown based on user settings and session state.
 *
 * Conditions for showing instructions:
 * - Page template is ready
 * - Settings are loaded
 * - User has enabled "always show instructions"
 * - User hasn't dismissed instructions in current session
 *
 * @example
 * ```typescript
 * useAutoShowInstructions(); // Automatically shows instructions if conditions are met
 * ```
 */
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
