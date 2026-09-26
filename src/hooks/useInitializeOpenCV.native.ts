/**
 * Return type for the useInitializeOpenCV hook: whether OpenCV's WASM
 * runtime has finished initializing.
 */
type UseInitializeOpenCV = boolean;

/**
 * Native (iOS/Android) implementation of useInitializeOpenCV (see
 * useInitializeOpenCV.ts for the web one). Native's OpenCV binding
 * (react-native-fast-opencv) is a synchronous native module - there's no
 * WASM runtime to wait for, so this resolves ready immediately.
 *
 * @returns UseInitializeOpenCV - always true on native
 *
 * @example
 * ```typescript
 * const isReady = useInitializeOpenCV();
 * ```
 */
export const useInitializeOpenCV = (): UseInitializeOpenCV => true;
