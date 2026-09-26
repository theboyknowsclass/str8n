import { Platform } from 'react-native';
import { create } from 'zustand';
import { CalibrationSample } from '@types';
import { AsyncStorageService } from '@services/AsyncStorageService';
import { CalibrationPhotoStorageService } from '@services/CalibrationPhotoStorageService';

/**
 * Calibration state interface that tracks the saved detection ground-truth
 * samples used by the calibration sweep (see useCalibrationSweep). This is
 * a developer-facing tool (see the __DEV__-gated Calibration screen and Edit
 * screen action) for finding good real-world auto-detection thresholds, not
 * a user-facing feature.
 * @property samples - The saved ground-truth samples
 * @property isReady - Whether the samples have been loaded from storage
 * @property loadSamples - Loads samples from AsyncStorage into the store
 * @property addSample - Adds a new sample and persists the updated list
 * @property removeSample - Removes a sample by id and persists the updated list
 */
type CalibrationState = {
  samples: CalibrationSample[];
  isReady: boolean;
  loadSamples: () => Promise<void>;
  addSample: (sample: CalibrationSample) => void;
  removeSample: (id: string) => void;
};

/**
 * Zustand store for the detection-calibration ground-truth samples.
 *
 * @example
 * ```typescript
 * const { samples, addSample, removeSample } = useCalibrationStore();
 * ```
 */
export const useCalibrationStore = create<CalibrationState>()((set, get) => ({
  samples: [],
  isReady: false,
  loadSamples: async () => {
    const storedSamples = await AsyncStorageService.getCalibrationSamples();
    // On web, a sample's persisted imageUri is just the original blob: URL
    // (see CalibrationPhotoStorageService's docs) - it's guaranteed dead by
    // the time this runs, since blob: URLs don't survive the reload that
    // just brought this store back to life. Re-derive a fresh one from the
    // durable IndexedDB copy for each sample here, rather than ever
    // persisting a blob: URL itself. A sample with nothing stored (e.g.
    // saved before this existed) is left with its stale URL, same
    // best-effort behavior as before this fix.
    const samples =
      Platform.OS === 'web'
        ? await Promise.all(
            storedSamples.map(async (sample) => {
              const freshImageUri =
                await CalibrationPhotoStorageService.loadPhotoUrl(sample.id);
              return freshImageUri
                ? { ...sample, imageUri: freshImageUri }
                : sample;
            })
          )
        : storedSamples;
    set({ samples, isReady: true });
  },
  addSample: (sample: CalibrationSample) => {
    const samples = [...get().samples, sample];
    AsyncStorageService.storeCalibrationSamples(samples);
    set({ samples });
  },
  removeSample: (id: string) => {
    const samples = get().samples.filter((sample) => sample.id !== id);
    AsyncStorageService.storeCalibrationSamples(samples);
    set({ samples });
    CalibrationPhotoStorageService.deletePhoto(id);
  },
}));
