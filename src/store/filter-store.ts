import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface SavedSearch {
  id: string;
  name: string;
  searchQuery: string;
  selectedTags: string[];
  selectedTypes: string[];
  selectedProviders: string[];
  selectedStatuses: string[];
  minYear: number | null;
  maxYear: number | null;
}

interface FilterState {
  searchQuery: string;
  selectedTags: string[];
  selectedTypes: string[];
  selectedProviders: string[];
  selectedStatuses: string[];
  minYear: number | null;
  maxYear: number | null;
  savedSearches: SavedSearch[];
  
  setSearchQuery: (query: string) => void;
  toggleTag: (tag: string) => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedTypes: (types: string[]) => void;
  setSelectedProviders: (providers: string[]) => void;
  setSelectedStatuses: (statuses: string[]) => void;
  setMinYear: (year: number | null) => void;
  setMaxYear: (year: number | null) => void;
  
  clearFilters: () => void;
  saveCurrentSearch: (name: string) => void;
  deleteSavedSearch: (id: string) => void;
  loadSavedSearch: (savedSearch: SavedSearch) => void;
}

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      searchQuery: "",
      selectedTags: [],
      selectedTypes: [],
      selectedProviders: [],
      selectedStatuses: [],
      minYear: null,
      maxYear: null,
      savedSearches: [],

      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleTag: (tag) => set((state) => ({
        selectedTags: state.selectedTags.includes(tag)
          ? state.selectedTags.filter(t => t !== tag)
          : [...state.selectedTags, tag]
      })),
      setSelectedTags: (tags) => set({ selectedTags: tags }),
      setSelectedTypes: (types) => set({ selectedTypes: types }),
      setSelectedProviders: (providers) => set({ selectedProviders: providers }),
      setSelectedStatuses: (statuses) => set({ selectedStatuses: statuses }),
      setMinYear: (year) => set({ minYear: year }),
      setMaxYear: (year) => set({ maxYear: year }),

      clearFilters: () => set({
        searchQuery: "",
        selectedTags: [],
        selectedTypes: [],
        selectedProviders: [],
        selectedStatuses: [],
        minYear: null,
        maxYear: null,
      }),

      saveCurrentSearch: (name) => {
        const { searchQuery, selectedTags, selectedTypes, selectedProviders, selectedStatuses, minYear, maxYear, savedSearches } = get();
        const newSearch: SavedSearch = {
          id: `saved-${Date.now()}`,
          name,
          searchQuery,
          selectedTags,
          selectedTypes,
          selectedProviders,
          selectedStatuses,
          minYear,
          maxYear
        };
        set({ savedSearches: [...savedSearches, newSearch] });
      },

      deleteSavedSearch: (id) => set((state) => ({
        savedSearches: state.savedSearches.filter(s => s.id !== id)
      })),

      loadSavedSearch: (savedSearch) => set({
        searchQuery: savedSearch.searchQuery,
        selectedTags: savedSearch.selectedTags,
        selectedTypes: savedSearch.selectedTypes,
        selectedProviders: savedSearch.selectedProviders,
        selectedStatuses: savedSearch.selectedStatuses,
        minYear: savedSearch.minYear,
        maxYear: savedSearch.maxYear
      }),
    }),
    {
      name: 'trackr-filters-storage',
      // Only persist savedSearches to avoid Next.js hydration mismatches
      partialize: (state) => ({ savedSearches: state.savedSearches }),
    }
  )
);
