import { Platform } from 'react-native';
import { CalibrationSample, Dimensions, ImageSource, Point } from '@types';
import { useCalibrationStore } from '@stores/useCalibrationStore';
import { debugLog } from '@utils/debugLog';
// Imports DetectionService directly rather than via the @services barrel -
// this file is itself exported from that barrel, so importing it back here
// would close a require cycle (same class of issue documented on
// usePersistedSettingsStore.ts).
import { CalibrationPhotoStorageService } from './CalibrationPhotoStorageService';
import { DetectionService } from './DetectionService';
import { FileSystemService } from './FileSystemService';

/**
 * Saves a photo and its (about-to-be-submitted or otherwise finalized)
 * corner points as a detection-calibration ground-truth sample. Dev builds
 * only - this is a developer tool for finding good real-world default
 * thresholds (see the Calibration and BatchCalibration screens), not a
 * user-facing feature.
 *
 * Shared by both the single-photo Edit flow (TransformImageButton, at the
 * moment the user submits a transform - "submitting" is the moment they
 * consider their corner placement correct) and the batch calibration
 * screen (at each "Save & Next"), so a change to what a sample contains
 * only needs to happen in one place.
 *
 * Fire-and-forget by design: callers should not await this on the UI's
 * critical path, since a failed save here should never hold up the user's
 * actual edit or block advancing to the next photo in a batch.
 *
 * @param uri - The picked image's URI
 * @param imageSize - The image's pixel dimensions
 * @param groundTruthPoints - The 4 hand-placed/corrected corner points,
 * relative (0-1), corner-ordered
 */
export const saveCalibrationSample = async (
  uri: string | null,
  imageSize: Dimensions,
  groundTruthPoints: Point[]
): Promise<void> => {
  debugLog('>>>> saveCalibrationSample: called', {
    uri,
    imageSize,
    groundTruthPoints,
  });

  if (!uri) {
    debugLog('>>>> saveCalibrationSample: no uri, skipping');
    return;
  }

  try {
    const id = `${Date.now()}`;
    const extensionMatch = uri.match(/\.(\w+)(?:\?.*)?$/);
    const extension = extensionMatch ? extensionMatch[1] : 'jpg';
    const imageUri = await FileSystemService.copyToPermanentStorage(
      uri,
      `${id}.${extension}`
    );
    debugLog('>>>> saveCalibrationSample: copied to permanent storage', {
      imageUri,
    });

    // On web, imageUri is still just the original blob: URL (see
    // FileSystemService.copyToPermanentStorage's docs) - it won't survive a
    // reload on its own, so the actual bytes get a durable copy in
    // IndexedDB here too. useCalibrationStore.loadSamples re-derives a
    // fresh blob: URL from this copy every time samples are loaded, rather
    // than ever persisting a blob: URL itself.
    if (Platform.OS === 'web') {
      const photo = await fetch(uri).then((response) => response.blob());
      await CalibrationPhotoStorageService.savePhoto(id, photo);
      debugLog('>>>> saveCalibrationSample: photo stored in IndexedDB', {
        id,
      });
    }

    const imageSource: ImageSource = { uri, dimensions: imageSize, tags: null };
    const features = await DetectionService.computeFeatures(imageSource);
    debugLog('>>>> saveCalibrationSample: computed features', { features });

    const sample: CalibrationSample = {
      id,
      imageUri,
      width: imageSize.width,
      height: imageSize.height,
      groundTruthPoints,
      ...(features ? { features } : {}),
    };
    useCalibrationStore.getState().addSample(sample);
    debugLog('>>>> saveCalibrationSample: sample saved', { id });
  } catch (error) {
    debugLog('>>>> saveCalibrationSample: threw', { error: String(error) });
    console.error('Error saving calibration sample', error);
  }
};
