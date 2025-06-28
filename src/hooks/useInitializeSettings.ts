import { useEffect } from 'react';
import { usePersistedSettingsStore } from '@stores';
import { AsyncStorageService } from '@services';

/**
 * Return type for the useInitializeSettings hook.
 * @property isReady - Boolean indicating if settings initialization is complete
 */
type UseInitializeSettings = boolean;

/**
 * Hook for initializing persisted settings from AsyncStorage.
 * Loads stored settings and applies them to the store, then sets isReady to true.
 *
 * @returns UseInitializeSettings boolean indicating if settings are ready
 *
 * @example
 * ```typescript
 * const isReady = useInitializeSettings();
 * ```
 */
export const useInitializeSettings = (): UseInitializeSettings => {
  const {
    setCropToOverlay,
    setMaintainExifMetadata,
    setAlwaysShowInstructions,
    setIsReady,
    isReady,
  } = usePersistedSettingsStore();

  useEffect(() => {
    const loadInitialData = async () => {
      const storedSettings = await AsyncStorageService.getStoredSettings();
      if (storedSettings) {
        setCropToOverlay(storedSettings.cropToOverlay);
        setMaintainExifMetadata(storedSettings.maintainExifMetadata);
        setAlwaysShowInstructions(storedSettings.alwaysShowInstructions);
      }
      setIsReady(true);
    };
    loadInitialData();
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return isReady;
};
