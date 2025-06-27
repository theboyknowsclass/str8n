import { create } from 'zustand';
import { Page } from '../types/Pages';

/**
 * Session state interface that manages temporary app state during a user session.
 * This state is not persisted and resets when the app is closed.
 * @property hasDismissedInstructions - Whether the user has dismissed the instructions modal
 * @property currentPage - The current active page in the app
 * @property startPage - The page where the user started their session
 * @property setHasDismissedInstructions - Sets whether the user has dismissed the instructions modal
 * @property setCurrentPage - Sets the current active page
 * @property setStartPage - Sets the starting page for the current session
 */
type SessionState = {
  hasDismissedInstructions: boolean;
  currentPage: Page;
  startPage: Page;
  setHasDismissedInstructions: (hasDismissedInstructions: boolean) => void;
  setCurrentPage: (currentPage: Page) => void;
  setStartPage: (startPage: Page) => void;
};

/**
 * Zustand store for managing session state.
 *
 * This store handles temporary state that persists during a user session
 * but is not saved between app launches. It manages navigation state,
 * instruction dismissal status, and session flow tracking.
 *
 * @example
 * ```typescript
 * const { currentPage, setCurrentPage, startPage } = useSessionStateStore();
 *
 * // Navigate to a new page
 * setCurrentPage(Page.EDIT);
 *
 * // Check if user has moved from starting point
 * const hasNavigated = currentPage !== startPage;
 * ```
 */
export const useSessionStateStore = create<SessionState>()((set) => ({
  hasDismissedInstructions: false,
  currentPage: 'import',
  startPage: 'import',
  setHasDismissedInstructions: (hasDismissedInstructions: boolean) =>
    set({ hasDismissedInstructions }),
  setCurrentPage: (currentPage: Page) => set({ currentPage }),
  setStartPage: (startPage: Page) => set({ startPage }),
}));
