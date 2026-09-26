import { Platform } from 'react-native';

/**
 * Web-only diagnostic logger for the auto-detection pipeline, prefixed with
 * '>>>>' at each call site so the browser console can be filtered to just
 * these lines independent of React's own noise.
 *
 * JSON.stringifies the payload rather than passing it as a live object:
 * these logs are only ever read after being copy-pasted out of the browser
 * console as flat text (not inspected interactively), where a nested
 * array/object would otherwise print as the console's lazy-collapsed
 * "Array(4)"/"Object" placeholder instead of its actual values.
 */
export const debugLog = (message: string, data?: unknown): void => {
  if (Platform.OS !== 'web') {
    return;
  }
  if (data === undefined) {
    console.warn(message);
    return;
  }
  console.warn(message, JSON.stringify(data));
};
