import { useEffect } from 'react';
import { usePersistedSettingsStore } from '@stores';
import { AsyncStorageService } from '@services';

/**
 * Custom hook for managing persisted settings following the Single Responsibility Principle.
 * This hook:
 * 1. Retrieves the stored settings from AsyncStorage
 * 2. Loads the stored settings or uses the default values
 */
export const useSavedSettings = () => {
  const {
    cropToOverlay,
    maintainExifMetadata,
    alwaysShowInstructions,
    setCropToOverlay,
    setMaintainExifMetadata,
    setAlwaysShowInstructions,
  } = usePersistedSettingsStore();

  useEffect(() => {
    const loadInitialData = async () => {
      const storedSettings = await AsyncStorageService.getStoredSettings();
      if (storedSettings) {
        setCropToOverlay(storedSettings.cropToOverlay);
        setMaintainExifMetadata(storedSettings.maintainExifMetadata);
        setAlwaysShowInstructions(storedSettings.alwaysShowInstructions);
      }
    };

    loadInitialData();
  }, [setCropToOverlay, setMaintainExifMetadata, setAlwaysShowInstructions]);

  return {
    cropToOverlay,
    maintainExifMetadata,
    alwaysShowInstructions,
    setCropToOverlay,
    setMaintainExifMetadata,
    setAlwaysShowInstructions,
  };
};
