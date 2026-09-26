import { create } from 'zustand';
import { AsyncStorageService } from '@services/AsyncStorageService';

/**
 * Tracks which filenames the batch calibration screen has already
 * processed, persisted across sessions - a real batch of downloaded photos
 * isn't expected to be processed in one sitting, so re-picking the same
 * source folder later should skip whatever's already been saved/skipped
 * rather than showing it again. Dev-only tool, not a user-facing feature.
 * @property processedFilenames - The filenames already processed
 * @property isReady - Whether the filenames have been loaded from storage
 * @property loadProcessedFilenames - Loads filenames from AsyncStorage
 * @property markProcessed - Marks a filename as processed and persists it
 */
type BatchCalibrationState = {
  processedFilenames: string[];
  isReady: boolean;
  loadProcessedFilenames: () => Promise<void>;
  markProcessed: (filename: string) => void;
};

export const useBatchCalibrationStore = create<BatchCalibrationState>()(
  (set, get) => ({
    processedFilenames: [],
    isReady: false,
    loadProcessedFilenames: async () => {
      const processedFilenames =
        await AsyncStorageService.getProcessedCalibrationFilenames();
      set({ processedFilenames, isReady: true });
    },
    markProcessed: (filename: string) => {
      const processedFilenames = [...get().processedFilenames, filename];
      AsyncStorageService.storeProcessedCalibrationFilenames(
        processedFilenames
      );
      set({ processedFilenames });
    },
  })
);
