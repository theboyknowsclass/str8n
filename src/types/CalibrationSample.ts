import { Point } from './Point';
import { DiagonalFeatures } from '@utils/detectionUtils';

/**
 * A single ground-truth sample for the detection-calibration sweep: a
 * photo, its dimensions, and the corner points the user hand-placed as the
 * correct answer (see the Edit screen's dev-only "save as ground truth"
 * action). The image itself is copied to permanent app storage when the
 * sample is saved, since the original picker URI is often a temporary
 * cache path that isn't guaranteed to survive an app restart.
 * @property id - Unique identifier for the sample
 * @property imageUri - Permanent on-device URI of the copied image
 * @property width - The image's width in pixels
 * @property height - The image's height in pixels
 * @property groundTruthPoints - The 4 hand-placed corner points, relative (0-1), corner-ordered
 * @property features - The photo's diagonal feature vector (see
 * computeDiagonalFeatures), computed once at save time since it depends
 * only on the photo, not on where the corner points ended up. Optional
 * because samples saved before this field existed won't have it - the
 * calibration API upload skips those rather than failing on them.
 */
export type CalibrationSample = {
  id: string;
  imageUri: string;
  width: number;
  height: number;
  groundTruthPoints: Point[];
  features?: DiagonalFeatures;
};
