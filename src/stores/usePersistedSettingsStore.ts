import { PersistedSettings } from '@types';
import { create } from 'zustand';
import { AsyncStorageService } from '@services';

/**
 * Represents the state of the settings store.
 * @property cropToOverlay - Whether to crop the image to the overlay bounds
 * @property setCropToOverlay - Function to set the cropToOverlay setting
 * @property isReady - Whether the settings are loaded
 * @property setIsReady - Function to set the isReady setting
 */
type PersistedSettingsState = PersistedSettings & {
  setCropToOverlay: (cropToOverlay: boolean) => void;
  setMaintainExifMetadata: (maintainExifMetadata: boolean) => void;
  setAlwaysShowInstructions: (alwaysShowInstructions: boolean) => void;
  isReady: boolean;
  setIsReady: (isReady: boolean) => void;
};

/**
 * Creates the settings store using the Zustand library.
 * @param set - The set function from Zustand
 * @returns The settings store
 */
export const usePersistedSettingsStore = create<PersistedSettingsState>()(
  (set, get) => ({
    cropToOverlay: false,
    maintainExifMetadata: false,
    alwaysShowInstructions: true,
    isReady: false,
    setIsReady: (isReady: boolean) => set({ isReady }),
    setCropToOverlay: (cropToOverlay: boolean) => {
      const { maintainExifMetadata, alwaysShowInstructions } = get();
      const newSettings = {
        cropToOverlay,
        maintainExifMetadata,
        alwaysShowInstructions,
      };
      AsyncStorageService.storeSettings(newSettings);
      set({ cropToOverlay });
    },
    setMaintainExifMetadata: (maintainExifMetadata: boolean) => {
      const { cropToOverlay, alwaysShowInstructions } = get();
      const newSettings = {
        cropToOverlay,
        maintainExifMetadata,
        alwaysShowInstructions,
      };
      AsyncStorageService.storeSettings(newSettings);
      set({ maintainExifMetadata });
    },
    setAlwaysShowInstructions: (alwaysShowInstructions: boolean) => {
      const { cropToOverlay, maintainExifMetadata } = get();
      const newSettings = {
        cropToOverlay,
        maintainExifMetadata,
        alwaysShowInstructions,
      };
      AsyncStorageService.storeSettings(newSettings);
      set({ alwaysShowInstructions });
    },
  })
);
