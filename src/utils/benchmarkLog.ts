/**
 * Dev-only console timer for a named async operation - currently used to
 * benchmark the auto-detect ("magic wand") and perspective-transform
 * pipeline stages (see useAutoDetectCorners/useTransformImage) across
 * devices and photos. No-ops the timing outside __DEV__ so release builds
 * never pay for a stray Date.now() call and end users never see it.
 *
 * Logs via console.warn (console.log is disallowed by this project's
 * eslint config) rather than debugLog: debugLog is deliberately web-only
 * (built for the calibration workflow's browser-console copy/paste use
 * case), but benchmarking needs to be visible on native devices too,
 * where the real-world performance question actually lives.
 */
export const logDuration = async <T>(
  label: string,
  task: () => Promise<T>
): Promise<T> => {
  if (!__DEV__) {
    return task();
  }
  const startTime = Date.now();
  try {
    return await task();
  } finally {
    console.warn(`[benchmark] ${label}: ${Date.now() - startTime}ms`);
  }
};
