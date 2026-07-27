"use client";

import React, { useState } from "react";
import { useFilterStore } from "@/store/filter-store";
import { Star, X, Plus, Search, Check } from "lucide-react";

export function SavedSearchesBar() {
  const { 
    savedSearches, 
    saveCurrentSearch, 
    deleteSavedSearch, 
    loadSavedSearch,
    searchQuery,
    selectedTags,
    selectedTypes,
    selectedProviders,
    selectedStatuses,
    minYear,
    maxYear
  } = useFilterStore();

  const [isSaving, setIsSaving] = useState(false);
  const [searchName, setSearchName] = useState("");

  const hasActiveFilters = 
    searchQuery.trim().length > 0 ||
    selectedTags.length > 0 ||
    selectedTypes.length > 0 ||
    selectedProviders.length > 0 ||
    selectedStatuses.length > 0 ||
    minYear !== null ||
    maxYear !== null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchName.trim()) return;
    saveCurrentSearch(searchName.trim());
    setSearchName("");
    setIsSaving(false);
  };

  return (
    <div className="space-y-2 mb-4">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <Star className="size-3 text-amber-500 fill-amber-500/20" /> Saved Presets
        </span>
        
        {hasActiveFilters && !isSaving && (
          <button
            onClick={() => setIsSaving(true)}
            className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-0.5 active:scale-95 transition-all"
          >
            <Plus className="size-3" /> Save Current Preset
          </button>
        )}
      </div>

      {isSaving && (
        <form onSubmit={handleSave} className="flex gap-2 bg-secondary/25 p-2 rounded-lg border border-border/40">
          <input
            type="text"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            placeholder="Preset name (e.g. 90s Sci-Fi)"
            className="flex-1 h-8 px-2.5 rounded bg-background border border-border/40 text-xs outline-none focus:border-primary/50 font-medium"
            autoFocus
          />
          <button
            type="submit"
            disabled={!searchName.trim()}
            className="h-8 px-3 rounded bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center gap-1"
          >
            <Check className="size-3" /> Save
          </button>
          <button
            type="button"
            onClick={() => setIsSaving(false)}
            className="h-8 px-2 rounded hover:bg-secondary text-xs text-muted-foreground transition-colors"
          >
            Cancel
          </button>
        </form>
      )}

      {savedSearches.length > 0 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
          {savedSearches.map((search) => (
            <div
              key={search.id}
              className="group flex items-center gap-1.5 bg-secondary/35 border border-border/30 hover:border-primary/30 rounded-full px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-all shrink-0 cursor-pointer"
              onClick={() => loadSavedSearch(search)}
            >
              <Search className="size-3 text-muted-foreground/60 group-hover:text-primary transition-colors" />
              <span>{search.name}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteSavedSearch(search.id);
                }}
                className="ml-1 text-muted-foreground/40 hover:text-destructive transition-colors rounded-full hover:bg-secondary/80 p-0.5"
                title="Delete preset"
              >
                <X className="size-2.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        !isSaving && (
          <p className="text-xs text-muted-foreground/50 italic leading-none">
            No saved presets yet. Apply filters and click "Save Current Preset".
          </p>
        )
      )}
    </div>
  );
}
