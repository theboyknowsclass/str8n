import { create } from 'zustand';

/**
 * Represents the state of the settings store.
 * @property cropToOverlay - Whether to crop the image to the overlay bounds
 * @property setCropToOverlay - Function to set the cropToOverlay setting
 */
type SettingsState = {
  cropToOverlay: boolean;
  maintainExifMetadata: boolean;
  alwaysShowInstructions: boolean;
  setCropToOverlay: (cropToOverlay: boolean) => void;
  setMaintainExifMetadata: (maintainExifMetadata: boolean) => void;
  setAlwaysShowInstructions: (alwaysShowInstructions: boolean) => void;
};

/**
 * Creates the settings store using the Zustand library.
 * @param set - The set function from Zustand
 * @returns The settings store
 */
export const useSettingsStore = create<SettingsState>()((set) => ({
  cropToOverlay: false,
  maintainExifMetadata: false,
  alwaysShowInstructions: true,
  setCropToOverlay: (cropToOverlay: boolean) => set({ cropToOverlay }),
  setMaintainExifMetadata: (maintainExifMetadata: boolean) =>
    set({ maintainExifMetadata }),
  setAlwaysShowInstructions: (alwaysShowInstructions: boolean) =>
    set({ alwaysShowInstructions }),
}));
