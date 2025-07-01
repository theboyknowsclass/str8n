import { useEffect } from 'react';
import { usePersistedSettingsStore, useSessionStateStore } from '@stores';
import { useNavigation } from './useNavigation';
import { usePageTemplateContext } from '@contexts';

/**
 * Hook that automatically shows instructions when certain conditions are met.
 *
 * This hook checks if instructions should be shown based on user settings and session state.
 * It is typically used at the top level of a page or component to ensure users see instructions
 * when appropriate (e.g., on first use or when 'always show instructions' is enabled).
 *
 * Conditions for showing instructions:
 * - Page template is ready
 * - Settings are loaded
 * - User has enabled "always show instructions"
 * - User hasn't dismissed instructions in current session
 *
 * @example
 * useAutoShowInstructions(); // Automatically shows instructions if conditions are met
 */
export const useAutoShowInstructions = () => {
  const { isTemplateReady } = usePageTemplateContext();
  const { hasDismissedInstructions } = useSessionStateStore();
  const { alwaysShowInstructions, isReady: isSettingsReady } =
    usePersistedSettingsStore();
  const { navigate } = useNavigation();

  useEffect(
    () => {
      if (
        isTemplateReady &&
        isSettingsReady &&
        alwaysShowInstructions &&
        !hasDismissedInstructions
      ) {
        navigate('instructions');
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isTemplateReady, isSettingsReady] // only run when page is ready
  );
};
