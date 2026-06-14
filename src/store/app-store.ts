import { create } from 'zustand';

interface AppState {
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  toggleQuickAdd: () => void;
  searchFocused: boolean;
  setSearchFocused: (focused: boolean) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  hasPendingWrites: boolean;
  setHasPendingWrites: (pending: boolean) => void;
  installPrompt: any;
  setInstallPrompt: (prompt: any) => void;
}

export const useAppStore = create<AppState>((set) => ({
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  toggleQuickAdd: () => set((state) => ({ quickAddOpen: !state.quickAddOpen })),
  searchFocused: false,
  setSearchFocused: (focused) => set({ searchFocused: focused }),
  isOnline: true,
  setIsOnline: (online) => set({ isOnline: online }),
  hasPendingWrites: false,
  setHasPendingWrites: (pending) => set({ hasPendingWrites: pending }),
  installPrompt: null,
  setInstallPrompt: (prompt) => set({ installPrompt: prompt }),
}));
