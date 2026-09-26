import { PersistedSettings } from '@types';
import { create } from 'zustand';
import { AsyncStorageService } from '@services/AsyncStorageService';
import { ExportedTreeEnsemble } from '@services/CalibrationApiClient';
import {
  DEFAULT_CANNY_SIGMA,
  DEFAULT_APPROX_EPSILON_FRACTION,
} from '@utils/detectionUtils';

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
  setCannySigma: (cannySigma: number) => void;
  setApproxEpsilonFraction: (approxEpsilonFraction: number) => void;
  setLearnedThresholdModel: (
    learnedThresholdModel: ExportedTreeEnsemble | null
  ) => void;
  setShadowRemovalEnabled: (shadowRemovalEnabled: boolean) => void;
  setLineSegmentDetectionEnabled: (
    lineSegmentDetectionEnabled: boolean
  ) => void;
  isReady: boolean;
  setIsReady: (isReady: boolean) => void;
};

/**
 * Merges a partial update into the current persisted settings, persists the
 * full resulting settings object to AsyncStorage, and applies the update to
 * the store. Shared by every setter below so adding a new persisted setting
 * doesn't mean touching every existing setter's field list.
 */
const persistAndSet = (
  get: () => PersistedSettingsState,
  set: (partial: Partial<PersistedSettingsState>) => void,
  update: Partial<PersistedSettings>
): void => {
  const {
    cropToOverlay,
    maintainExifMetadata,
    alwaysShowInstructions,
    showZoomView,
    cannySigma,
    approxEpsilonFraction,
    learnedThresholdModel,
    shadowRemovalEnabled,
    lineSegmentDetectionEnabled,
  } = get();
  const newSettings: PersistedSettings = {
    cropToOverlay,
    maintainExifMetadata,
    alwaysShowInstructions,
    showZoomView,
    cannySigma,
    approxEpsilonFraction,
    learnedThresholdModel,
    shadowRemovalEnabled,
    lineSegmentDetectionEnabled,
    ...update,
  };
  AsyncStorageService.storeSettings(newSettings);
  set(update);
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
    cannySigma: DEFAULT_CANNY_SIGMA,
    approxEpsilonFraction: DEFAULT_APPROX_EPSILON_FRACTION,
    shadowRemovalEnabled: false,
    lineSegmentDetectionEnabled: false,
    isReady: false,
    setIsReady: (isReady: boolean) => set({ isReady }),
    setCropToOverlay: (cropToOverlay: boolean) =>
      persistAndSet(get, set, { cropToOverlay }),
    setMaintainExifMetadata: (maintainExifMetadata: boolean) =>
      persistAndSet(get, set, { maintainExifMetadata }),
    setAlwaysShowInstructions: (alwaysShowInstructions: boolean) =>
      persistAndSet(get, set, { alwaysShowInstructions }),
    setShowZoomView: (showZoomView: boolean) =>
      persistAndSet(get, set, { showZoomView }),
    setCannySigma: (cannySigma: number) =>
      persistAndSet(get, set, { cannySigma }),
    setApproxEpsilonFraction: (approxEpsilonFraction: number) =>
      persistAndSet(get, set, { approxEpsilonFraction }),
    setLearnedThresholdModel: (
      learnedThresholdModel: ExportedTreeEnsemble | null
    ) => persistAndSet(get, set, { learnedThresholdModel }),
    setShadowRemovalEnabled: (shadowRemovalEnabled: boolean) =>
      persistAndSet(get, set, { shadowRemovalEnabled }),
    setLineSegmentDetectionEnabled: (lineSegmentDetectionEnabled: boolean) =>
      persistAndSet(get, set, { lineSegmentDetectionEnabled }),
  })
);
