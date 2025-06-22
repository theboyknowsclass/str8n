import { create } from 'zustand';

type SessionState = {
  hasDismissedInstructions: boolean;
  setHasDismissedInstructions: (hasDismissedInstructions: boolean) => void;
};

export const useSessionStateStore = create<SessionState>()((set) => ({
  hasDismissedInstructions: false,
  setHasDismissedInstructions: (hasDismissedInstructions: boolean) =>
    set({ hasDismissedInstructions }),
}));
