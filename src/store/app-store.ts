import { create } from 'zustand';

interface AppState {
  quickAddOpen: boolean;
  setQuickAddOpen: (open: boolean) => void;
  toggleQuickAdd: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  quickAddOpen: false,
  setQuickAddOpen: (open) => set({ quickAddOpen: open }),
  toggleQuickAdd: () => set((state) => ({ quickAddOpen: !state.quickAddOpen })),
}));
