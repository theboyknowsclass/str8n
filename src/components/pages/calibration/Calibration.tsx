import { useEffect, useState } from 'react';
import { Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { ModalPageTemplate } from '@templates';
import { Text, TextButton } from '@atoms';
import { useCalibrationStore, usePersistedSettingsStore } from '@stores';
import { useCalibrationSweep } from '@hooks';
import { verifyTreeEnsemble } from '@utils/treeEnsembleUtils';

/**
 * Calibration page component - a developer-only tool for finding good
 * real-world default thresholds for the auto-detection pipeline.
 *
 * Lists the ground-truth samples saved from the Edit screen's dev-only
 * "save as ground truth" action, and runs a sweep of threshold
 * combinations against them, scoring each by average IoU against the
 * hand-marked corners. "Train via API" additionally uploads that same
 * sweep's (feature vector, combination, IoU) records to the local
 * CalibrationApi service (services/CalibrationApi - must be run manually,
 * `dotnet run`) and trains a FastTree model, exposing two different things
 * a dev can do with it: hand-copy its single best-combination recommendation
 * into DEFAULT_CANNY_SIGMA/DEFAULT_APPROX_EPSILON_FRACTION in
 * detectionUtils.ts (same "one fixed pair for every photo" idea as the
 * local sweep's own results, just found via a proper ML.NET search rather
 * than the fixed local grid), or apply the trained model itself - which
 * predicts per-photo thresholds from a photo's own features (see
 * predictThresholdsFromFeatures's docs) - either just to this device for
 * live testing, or, once it's trusted, copy its exported JSON over
 * @assets/learnedThresholdModel.json to ship it to every install. "Apply
 * to this device" (either kind) only updates this device's local
 * settings; it does not change what other installs get until that JSON
 * file is committed.
 *
 * @returns JSX element containing the calibration interface
 *
 * @example
 * ```typescript
 * <Calibration />
 * ```
 */
export const Calibration: React.FC = () => {
  const { samples, isReady, loadSamples, removeSample } = useCalibrationStore();
  const {
    setCannySigma,
    setApproxEpsilonFraction,
    setLearnedThresholdModel,
    learnedThresholdModel,
    setLineSegmentDetectionEnabled,
  } = usePersistedSettingsStore();
  const [learnedModelError, setLearnedModelError] = useState<string | null>(
    null
  );
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const {
    isRunning,
    results,
    runSweep,
    uploadableRecordCount,
    combinationsPerSample,
    lineSegmentAverageIoU,
    isTraining,
    trainingResult,
    trainingError,
    uploadAndTrain,
  } = useCalibrationSweep();

  useEffect(() => {
    if (!isReady) {
      loadSamples();
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Dev-only automation hook: exposes the sweep and its latest results on
  // window so a script (see tools/calibration-dataset) can trigger a sweep
  // and read back both strategies' IoU without a human clicking through
  // this screen - the same regression check a person would run by hand,
  // just callable directly. Never present outside __DEV__ web builds, and
  // never read by any production code path.
  useEffect(() => {
    if (!__DEV__ || Platform.OS !== 'web') {
      return;
    }
    (window as unknown as { __str8nCalibration?: unknown }).__str8nCalibration =
      {
        runSweep,
        results,
        lineSegmentAverageIoU,
        sampleCount: samples.length,
      };
  }, [runSweep, results, lineSegmentAverageIoU, samples.length]);

  const onApplyLearnedModel = () => {
    if (!trainingResult) {
      return;
    }
    // Never apply an exported model without first confirming this app's
    // own tree-walking code reproduces the API's own predictions for it -
    // see verifyTreeEnsemble's docs on exactly what this is guarding
    // against.
    const isVerified = verifyTreeEnsemble(
      trainingResult.exportedModel,
      trainingResult.verificationVectors
    );
    if (!isVerified) {
      setLearnedModelError(
        'This learned model failed verification and was not applied - see the console for details.'
      );
      console.error(
        'Learned threshold model failed verification against the API' +
          "'s own predictions for the same model - not applying it.",
        trainingResult.exportedModel
      );
      return;
    }
    setLearnedModelError(null);
    setLearnedThresholdModel(trainingResult.exportedModel);
  };

  const onCopyLearnedModelJson = async () => {
    if (!trainingResult) {
      return;
    }
    const isVerified = verifyTreeEnsemble(
      trainingResult.exportedModel,
      trainingResult.verificationVectors
    );
    if (!isVerified) {
      setCopyStatus(
        'This learned model failed verification and was not copied - see the console for details.'
      );
      console.error(
        'Learned threshold model failed verification against the API' +
          "'s own predictions for the same model - not copying it.",
        trainingResult.exportedModel
      );
      return;
    }

    // Same shape @assets/learnedThresholdModel.json is committed as (see
    // shippedLearnedThresholdModel.ts's docs) - paste this over that
    // file's contents to ship the model to every install.
    const json = JSON.stringify(
      {
        exportedModel: trainingResult.exportedModel,
        verificationVectors: trainingResult.verificationVectors,
      },
      null,
      2
    );

    if (Platform.OS === 'web') {
      await navigator.clipboard.writeText(json);
      setCopyStatus(
        'Copied to clipboard - paste over src/assets/learnedThresholdModel.json and commit.'
      );
    } else {
      // No clipboard API wired up for native here - this whole
      // calibration workflow is exercised on web in practice (see
      // BatchCalibration's docs), so this is a "still works, just less
      // convenient" fallback rather than a real native path.
      console.warn(json);
      setCopyStatus(
        'Clipboard copy is web-only here - printed to the console instead. Paste it over src/assets/learnedThresholdModel.json and commit.'
      );
    }
  };

  return (
    <ModalPageTemplate title="Detection Calibration">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contentContainer}
      >
        <Text size="large" style={styles.sectionTitle}>
          Samples ({samples.length})
        </Text>
        {samples.map((sample) => (
          <View key={sample.id} style={styles.sampleRow}>
            <Image source={{ uri: sample.imageUri }} style={styles.thumb} />
            <Text style={styles.sampleDimensions}>
              {sample.width}x{sample.height}
            </Text>
            <TextButton
              title="Delete"
              size="small"
              variant="outline"
              onPress={() => removeSample(sample.id)}
            />
          </View>
        ))}

        <TextButton
          title={isRunning ? 'Running sweep...' : 'Run calibration sweep'}
          onPress={runSweep}
          disabled={isRunning || samples.length === 0}
          style={styles.sweepButton}
        />

        {results.length > 0 && (
          <>
            <Text size="large" style={styles.sectionTitle}>
              Results (best first)
            </Text>
            {results.slice(0, 10).map((result) => (
              <View
                key={`${result.cannySigma}-${result.approxEpsilonFraction}`}
                style={styles.resultRow}
              >
                <Text style={styles.resultText}>
                  sigma {result.cannySigma}, epsilon{' '}
                  {result.approxEpsilonFraction} -{' '}
                  {(result.averageIoU * 100).toFixed(1)}% IoU
                </Text>
                <TextButton
                  title="Apply to this device"
                  size="small"
                  variant="outline"
                  onPress={() => {
                    setCannySigma(result.cannySigma);
                    setApproxEpsilonFraction(result.approxEpsilonFraction);
                  }}
                />
              </View>
            ))}

            {lineSegmentAverageIoU !== null && (
              <View style={styles.resultRow}>
                <Text style={styles.resultText}>
                  Line-segment strategy -{' '}
                  {(lineSegmentAverageIoU * 100).toFixed(1)}% IoU (best contour
                  combo above:{' '}
                  {results.length > 0
                    ? `${(results[0].averageIoU * 100).toFixed(1)}%`
                    : 'n/a'}
                  )
                </Text>
                <TextButton
                  title="Apply to this device"
                  size="small"
                  variant="outline"
                  onPress={() => setLineSegmentDetectionEnabled(true)}
                />
              </View>
            )}

            <TextButton
              title={
                isTraining
                  ? 'Training via API...'
                  : // uploadableRecordCount is (photos with a saved feature
                    // vector) x (sweep threshold combinations tested), not a
                    // photo count - spelling that out here after this number
                    // caused real confusion mid-session (14 photos x 9
                    // combinations read as "126 records").
                    `Train via API (${samples.length} photos x ${combinationsPerSample} combinations = ${uploadableRecordCount} records)`
              }
              onPress={uploadAndTrain}
              disabled={isTraining || uploadableRecordCount === 0}
              style={styles.sweepButton}
            />

            {trainingError && (
              <Text style={styles.trainingError}>
                {trainingError} (is the CalibrationApi service running locally?)
              </Text>
            )}

            {trainingResult && (
              <View style={styles.resultRow}>
                <Text style={styles.resultText}>
                  API: sigma {trainingResult.bestThresholds.cannySigma}, epsilon{' '}
                  {trainingResult.bestThresholds.approxEpsilonFraction} -{' '}
                  {(trainingResult.predictedAverageIoU * 100).toFixed(1)}%
                  predicted IoU (R² {trainingResult.modelRSquared.toFixed(2)},{' '}
                  {trainingResult.distinctPhotoCount} photos,{' '}
                  {trainingResult.sampleRecordCount} records)
                </Text>
                <TextButton
                  title="Apply to this device"
                  size="small"
                  variant="outline"
                  onPress={() => {
                    setCannySigma(trainingResult.bestThresholds.cannySigma);
                    setApproxEpsilonFraction(
                      trainingResult.bestThresholds.approxEpsilonFraction
                    );
                  }}
                />
              </View>
            )}

            {trainingResult && (
              <View style={styles.resultRow}>
                <Text style={styles.resultText}>
                  Learned model: predicts thresholds per photo from that
                  photo&apos;s own features, instead of one fixed pair for every
                  photo.
                </Text>
                <TextButton
                  title="Apply learned model to this device"
                  size="small"
                  variant="outline"
                  onPress={onApplyLearnedModel}
                />
              </View>
            )}

            {learnedModelError && (
              <Text style={styles.trainingError}>{learnedModelError}</Text>
            )}

            {learnedThresholdModel && (
              <Text style={styles.resultText}>
                A learned model is currently applied on this device.
              </Text>
            )}

            {trainingResult && (
              <View style={styles.resultRow}>
                <Text style={styles.resultText}>
                  Ready to ship this learned model to every install? Copy it as
                  the file everyone gets.
                </Text>
                <TextButton
                  title="Copy learned model JSON"
                  size="small"
                  variant="outline"
                  onPress={onCopyLearnedModelJson}
                />
              </View>
            )}

            {copyStatus && <Text style={styles.resultText}>{copyStatus}</Text>}
          </>
        )}
      </ScrollView>
    </ModalPageTemplate>
  );
};

const styles = StyleSheet.create({
  scroll: {
    width: '100%',
  },
  contentContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
    paddingVertical: 16,
  },
  sectionTitle: {
    marginTop: 8,
  },
  sampleRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 4,
  },
  sampleDimensions: {
    flex: 1,
  },
  sweepButton: {
    marginTop: 8,
  },
  resultRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  resultText: {
    flex: 1,
  },
  trainingError: {
    color: 'red',
  },
});
