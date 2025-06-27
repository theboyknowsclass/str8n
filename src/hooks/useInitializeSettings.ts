import { useEffect } from 'react';
import { usePersistedSettingsStore } from '@stores';
import { AsyncStorageService } from '@services';

/**
 * Initializes persisted settings from AsyncStorage and sets isReady to true when done.
 * Returns only isReady.
 */
export const useInitializeSettings = () => {
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
