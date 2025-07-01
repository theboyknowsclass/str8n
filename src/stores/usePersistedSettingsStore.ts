import { PersistedSettings } from '@types';
import { create } from 'zustand';
import { AsyncStorageService } from '@services';

/**
 * Persisted settings state interface that manages user preferences.
 * This state extends PersistedSettings with setter methods and ready state.
 * Settings are automatically saved to AsyncStorage when changed.
 * @property cropToOverlay - Whether to automatically crop the transformed image to fit the overlay boundaries
 * @property maintainExifMetadata - Whether to preserve EXIF metadata when transforming images
 * @property alwaysShowInstructions - Whether to always display instruction text to guide users
 * @property isReady - Whether the settings have been loaded from storage
 * @property setCropToOverlay - Sets the cropToOverlay setting and saves to storage
 * @property setMaintainExifMetadata - Sets the maintainExifMetadata setting and saves to storage
 * @property setAlwaysShowInstructions - Sets the alwaysShowInstructions setting and saves to storage
 * @property setIsReady - Sets the ready state of the settings
 */
type PersistedSettingsState = PersistedSettings & {
  setCropToOverlay: (cropToOverlay: boolean) => void;
  setMaintainExifMetadata: (maintainExifMetadata: boolean) => void;
  setAlwaysShowInstructions: (alwaysShowInstructions: boolean) => void;
  setShowZoomView: (showZoomView: boolean) => void;
  isReady: boolean;
  setIsReady: (isReady: boolean) => void;
};

/**
 * Zustand store for managing persisted user settings.
 *
 * This store handles user preferences that are automatically saved to AsyncStorage
 * and restored when the app launches. Settings include image processing options
 * and UI behavior preferences.
 *
 * @example
 * ```typescript
 * const {
 *   cropToOverlay,
 *   maintainExifMetadata,
 *   alwaysShowInstructions,
 *   setCropToOverlay,
 *   setMaintainExifMetadata,
 *   setAlwaysShowInstructions
 * } = usePersistedSettingsStore();
 *
 * // Update settings (automatically saved to storage)
 * setCropToOverlay(true);
 * setMaintainExifMetadata(false);
 * setAlwaysShowInstructions(true);
 * ```
 */
export const usePersistedSettingsStore = create<PersistedSettingsState>()(
  (set, get) => ({
    cropToOverlay: false,
    maintainExifMetadata: false,
    alwaysShowInstructions: true,
    showZoomView: true,
    isReady: false,
    setIsReady: (isReady: boolean) => set({ isReady }),
    setCropToOverlay: (cropToOverlay: boolean) => {
      const { ...rest } = get();
      const newSettings = { ...rest, cropToOverlay };
      AsyncStorageService.storeSettings(newSettings);
      set({ cropToOverlay });
    },
    setMaintainExifMetadata: (maintainExifMetadata: boolean) => {
      const { ...rest } = get();
      const newSettings = { ...rest, maintainExifMetadata };
      AsyncStorageService.storeSettings(newSettings);
      set({ maintainExifMetadata });
    },
    setAlwaysShowInstructions: (alwaysShowInstructions: boolean) => {
      const { ...rest } = get();
      const newSettings = { ...rest, alwaysShowInstructions };
      AsyncStorageService.storeSettings(newSettings);
      set({ alwaysShowInstructions });
    },
    setShowZoomView: (showZoomView: boolean) => {
      const { ...rest } = get();
      const newSettings = { ...rest, showZoomView };
      AsyncStorageService.storeSettings(newSettings);
      set({ showZoomView });
    },
  })
);
