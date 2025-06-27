import { create } from 'zustand';

/**
 * Sharing image state interface that manages the state of image sharing operations.
 * This state tracks sharing capabilities, current sharing status, and temporary file management.
 * @property canShare - Whether the current platform supports image sharing
 * @property isSharing - Whether an image sharing operation is currently in progress
 * @property temporaryFileUri - The URI of the temporary file being shared
 * @property setCanShare - Sets whether the platform supports image sharing
 * @property setIsSharing - Sets whether a sharing operation is in progress
 * @property setTemporaryFileUri - Sets the URI of the temporary file for sharing
 * @property clearSharingState - Clears all sharing state and resets to defaults
 */
type SharingImageState = {
  canShare: boolean;
  isSharing: boolean;
  temporaryFileUri: string | null;
  setCanShare: (canShare: boolean) => void;
  setIsSharing: (isSharing: boolean) => void;
  setTemporaryFileUri: (uri: string | null) => void;
  clearSharingState: () => void;
};

/**
 * Zustand store for managing image sharing state.
 *
 * This store handles the state of image sharing operations including
 * platform capability detection, sharing progress tracking, and temporary
 * file management for sharing operations.
 *
 * @example
 * ```typescript
 * const {
 *   canShare,
 *   isSharing,
 *   temporaryFileUri,
 *   setCanShare,
 *   setIsSharing,
 *   setTemporaryFileUri,
 *   clearSharingState
 * } = useSharingImageStore();
 *
 * // Check if sharing is supported
 * if (canShare) {
 *   // Start sharing process
 *   setIsSharing(true);
 *   setTemporaryFileUri('file://path/to/temp.jpg');
 *
 *   // After sharing completes
 *   setIsSharing(false);
 *   clearSharingState();
 * }
 *
 * // Clear all sharing state
 * clearSharingState();
 * ```
 */
export const useSharingImageStore = create<SharingImageState>()((set) => ({
  canShare: false,
  isSharing: false,
  temporaryFileUri: null,
  setCanShare: (canShare: boolean) => set({ canShare }),
  setIsSharing: (isSharing: boolean) => set({ isSharing }),
  setTemporaryFileUri: (temporaryFileUri: string | null) =>
    set({ temporaryFileUri }),
  clearSharingState: () =>
    set({
      canShare: false,
      isSharing: false,
      temporaryFileUri: null,
    }),
}));
