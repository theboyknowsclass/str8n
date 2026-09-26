import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { PageTemplate } from '@templates';
import { EditControl } from '@organisms';
import { Text, TextButton } from '@atoms';
import { AutoDetectButton } from '@molecules';
import {
  EditControlContextProvider,
  usePageTemplateContext,
  useEditControlContext,
} from '@contexts';
import {
  useBatchCalibrationStore,
  useOverlayStore,
  useSourceImageStore,
} from '@stores';
import { useAutoDetectCorners } from '@hooks';
import { ImagePickerService, saveCalibrationSample } from '@services';
import { debugLog } from '@utils/debugLog';
import { orderPointsByCorner } from '@utils/transformUtils';
import { ImageSource } from '@types';
import { useEdit } from '@pages/edit/useEdit';

type QueueItem = {
  image: ImageSource;
  fileName: string | null;
};

/**
 * BatchCalibration page component - a developer-only tool for turning a
 * whole folder of real photos into detection-calibration ground-truth
 * samples in one sitting, rather than picking, editing, and transforming
 * one photo at a time through the normal Edit flow.
 *
 * This is throwaway tooling built purely to speed up gathering training
 * data (see the Calibration screen and services/CalibrationApi) - not a
 * candidate for production polish, and expected to be replaced or removed
 * outright once enough real-world calibration data has been gathered.
 *
 * Picks multiple photos at once, auto-runs detection on each in turn
 * (unlike the normal Edit flow, where auto-detect is a manual action - this
 * tool's whole point is review-and-correct, not decide-whether-to-detect),
 * lets the user drag corners to correct a bad detection using the same
 * overlay editing UI as Edit, and saves a ground-truth sample on "Save &
 * Next" before advancing. Processed filenames are remembered across
 * sessions (see useBatchCalibrationStore) so re-picking the same folder
 * later skips whatever's already been done - a large batch of downloaded
 * photos isn't expected to be processed in one sitting.
 *
 * @returns JSX element containing the batch calibration interface
 *
 * @example
 * ```typescript
 * <BatchCalibration />
 * ```
 */
export const BatchCalibration: React.FC = () => {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPicking, setIsPicking] = useState(false);

  const { processedFilenames, isReady, loadProcessedFilenames } =
    useBatchCalibrationStore();
  const { setSourceImage } = useSourceImageStore();
  const { detectCorners } = useAutoDetectCorners();

  useEffect(() => {
    if (!isReady) {
      loadProcessedFilenames();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentItem = queue[currentIndex] ?? null;

  useEffect(() => {
    if (!currentItem) {
      return;
    }
    debugLog('>>>> BatchCalibration: loading photo', {
      currentIndex,
      fileName: currentItem.fileName,
    });
    setSourceImage(currentItem.image);
    detectCorners(currentItem.image);
    // Only re-run when the current photo actually changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentItem]);

  const onPickPhotos = async () => {
    setIsPicking(true);
    try {
      const { success, data, error } = await ImagePickerService.selectImages();
      debugLog('>>>> BatchCalibration: pick result', {
        success,
        count: data?.length,
        error: error ? String(error) : undefined,
      });
      if (success && data) {
        const alreadyProcessed = new Set(processedFilenames);
        const filtered = data.filter(
          (item) => !item.fileName || !alreadyProcessed.has(item.fileName)
        );
        debugLog('>>>> BatchCalibration: queue after filtering processed', {
          pickedCount: data.length,
          queuedCount: filtered.length,
        });
        setQueue(filtered);
        setCurrentIndex(0);
      }
    } finally {
      setIsPicking(false);
    }
  };

  if (!currentItem) {
    return (
      <PageTemplate>
        <View style={styles.emptyContainer}>
          <Text size="large">
            {queue.length === 0
              ? 'No photos queued'
              : `All ${queue.length} photos processed`}
          </Text>
          <TextButton
            title={isPicking ? 'Picking...' : 'Pick photos'}
            onPress={onPickPhotos}
            disabled={isPicking}
          />
        </View>
      </PageTemplate>
    );
  }

  return (
    <BatchEditScreen
      // Remounts the whole editing subtree per photo, so pan/zoom/point
      // state (all initialized once at mount from props) never carries
      // over stale values from the previous photo.
      key={currentItem.fileName ?? currentIndex}
      item={currentItem}
      progress={`${currentIndex + 1} of ${queue.length}`}
      onNext={() => setCurrentIndex((index) => index + 1)}
    />
  );
};

const BatchEditScreen: React.FC<{
  item: QueueItem;
  progress: string;
  onNext: () => void;
}> = ({ item, progress, onNext }) => {
  const { uri, dimensions, movablePoints } = useEdit();

  return (
    <EditControlContextProvider
      uri={uri}
      imageSize={dimensions}
      selectionPoints={movablePoints}
    >
      <PageTemplate>
        <PageTemplate.ActionItems>
          <BatchActionRow item={item} progress={progress} onNext={onNext} />
        </PageTemplate.ActionItems>
        <BatchEditArea />
      </PageTemplate>
    </EditControlContextProvider>
  );
};

const BatchEditArea: React.FC = () => {
  const {
    contentDimensions: { width, height },
    isTemplateReady,
  } = usePageTemplateContext();

  if (!isTemplateReady) {
    return null;
  }

  return (
    <View style={styles.container}>
      <EditControl width={width} height={height} />
    </View>
  );
};

const BatchActionRow: React.FC<{
  item: QueueItem;
  progress: string;
  onNext: () => void;
}> = ({ item, progress, onNext }) => {
  const { uri, imageSize, selectionPoints } = useEditControlContext();
  const { markProcessed } = useBatchCalibrationStore();
  const { resetPoints } = useOverlayStore();
  const [isSaving, setIsSaving] = useState(false);

  const advance = () => {
    debugLog('>>>> BatchCalibration: skip', { fileName: item.fileName });
    if (item.fileName) {
      markProcessed(item.fileName);
    }
    resetPoints();
    onNext();
  };

  const onSaveAndNext = async () => {
    setIsSaving(true);
    try {
      const orderedPoints = orderPointsByCorner(
        selectionPoints.map((p) => ({ x: p.x.value, y: p.y.value }))
      );
      debugLog('>>>> BatchCalibration: save & next', {
        fileName: item.fileName,
        orderedPoints,
      });
      await saveCalibrationSample(uri, imageSize, orderedPoints);
      advance();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={styles.actionColumn}>
      <View style={styles.actionRow}>
        <Text>{progress}</Text>
        {/* Lets you re-run (or reset back to) the detected quad at any
            point, e.g. after dragging a point by accident - same
            magic-wand button and detection path as the normal Edit screen. */}
        <AutoDetectButton />
        <TextButton
          title="Skip"
          size="small"
          variant="outline"
          onPress={advance}
          disabled={isSaving}
        />
        <TextButton
          title={isSaving ? 'Saving...' : 'Save & Next'}
          onPress={onSaveAndNext}
          disabled={isSaving}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  emptyContainer: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  actionColumn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  actionRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
});
