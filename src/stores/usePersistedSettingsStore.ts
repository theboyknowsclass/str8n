import { PersistedSettings } from '@types';
import { create } from 'zustand';
import { AsyncStorageService } from '@services';
import { bool } from '@techstark/opencv-js';

/**
 * Represents the state of the settings store.
 * @property cropToOverlay - Whether to crop the image to the overlay bounds
 * @property setCropToOverlay - Function to set the cropToOverlay setting
 */
type PersistedSettingsState = PersistedSettings & {
  setCropToOverlay: (cropToOverlay: boolean) => void;
  setMaintainExifMetadata: (maintainExifMetadata: boolean) => void;
  setAlwaysShowInstructions: (alwaysShowInstructions: boolean) => void;
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
