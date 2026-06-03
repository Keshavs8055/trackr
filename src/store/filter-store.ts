import { create } from 'zustand';

interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  clearFilters: () => void;
}

export const useFilterStore = create<FilterState>((set) => ({
  searchQuery: "",
  selectedTags: [],
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleTag: (tag) => set((state) => ({
    selectedTags: state.selectedTags.includes(tag)
      ? state.selectedTags.filter(t => t !== tag)
      : [...state.selectedTags, tag]
  })),
  clearFilters: () => set({ searchQuery: "", selectedTags: [] }),
}));
