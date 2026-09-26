import { useEffect, useState } from 'react';
import cv from '@techstark/opencv-js';

/**
 * Return type for the useInitializeOpenCV hook: whether OpenCV's WASM
 * runtime has finished initializing.
 */
type UseInitializeOpenCV = boolean;

/**
 * Hook that resolves once @techstark/opencv-js's WASM module has finished
 * initializing. Web-only (see useInitializeOpenCV.native.ts for every other
 * platform, which resolves immediately - native's OpenCV binding is a
 * synchronous native module with no WASM load delay).
 *
 * Without this, the app has no readiness gate at all for OpenCV on web: it
 * just imports `cv` and uses it directly, silently falling back to default
 * behavior (e.g. DetectionService.detectQuad's own `!cv.Mat` check) if a
 * user interacts before the WASM runtime is ready - which, combined with
 * the app rendering nothing (a blank page, not even a spinner) while any
 * of _layout.tsx's readiness checks are unmet, made a merely-slow WASM
 * load look indistinguishable from the app being broken.
 *
 * @returns UseInitializeOpenCV boolean indicating if OpenCV is ready
 *
 * @example
 * ```typescript
 * const isReady = useInitializeOpenCV();
 * ```
 */
export const useInitializeOpenCV = (): UseInitializeOpenCV => {
  const [isReady, setIsReady] = useState(!!cv.Mat);

  useEffect(() => {
    // Already ready by the time this effect runs - isReady's initializer
    // above already captured that, so there's nothing left to do here.
    // Calling setIsReady(true) again in that case would just be a
    // redundant synchronous setState inside an effect (a lint-flagged
    // anti-pattern - see react-hooks/set-state-in-effect) for no benefit.
    if (cv.Mat) {
      return;
    }

    const previousCallback = cv.onRuntimeInitialized;
    cv.onRuntimeInitialized = () => {
      previousCallback?.();
      setIsReady(true);
    };
  }, []);

  return isReady;
};
