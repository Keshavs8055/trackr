"use client";

import { useItems, useUserTags } from "@/hooks/use-items";
import { ItemCard } from "@/components/item-card";
import { useFilterStore } from "@/store/filter-store";
import { useTagAction } from "@/hooks/use-tag-action";
import { useAppStore } from "@/store/app-store";
import { Search, X } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";
import React, { useDeferredValue, useRef, useEffect, useMemo } from "react";

export default function Home() {
  const { data: items, isLoading } = useItems();
  const globalTags = useUserTags();
  
  const { searchQuery, setSearchQuery, selectedTags, clearFilters } = useFilterStore();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const handleTagAction = useTagAction();

  const { searchFocused, setSearchFocused } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Focus search input when triggered from navigation
  useEffect(() => {
    if (searchFocused && searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchFocused(false);
    }
  }, [searchFocused, setSearchFocused]);

  // Apply search query and multi-select tags filter
  const filteredItems = useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      // Search titles and tags
      const matchesSearch = !deferredSearchQuery || 
        item.title.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
        item.tags?.some(tag => tag.toLowerCase().includes(deferredSearchQuery.toLowerCase())) ||
        item.notes?.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => item.tags?.includes(t));
      
      // If filtering or searching, we show all matches including archived items to ensure visibility
      if (deferredSearchQuery || selectedTags.length > 0) {
        return matchesSearch && matchesTags;
      }
      
      // Default archive view: hide archived items
      return !item.archived && matchesSearch && matchesTags;
    });
  }, [items, deferredSearchQuery, selectedTags]);

  if (isLoading) {
    return <LoadingState />;
  }

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedTags.length > 0;

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-2xl mx-auto">
      {/* Sticky Header: Minimal Search & Tag Filters */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md pt-2 pb-4 -mx-4 px-4 border-b border-border/30 space-y-3.5">
        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input 
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search memories or #tags..." 
            className="w-full pl-9 pr-9 h-10 rounded-lg bg-secondary/35 border border-border/40 outline-none text-sm focus:border-primary/40 focus:ring-0 transition-all placeholder:text-muted-foreground/50 font-medium"
          />
          {hasActiveFilters && (
            <button 
              onClick={clearFilters}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground h-6 w-6 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all"
            >
              <X className="size-3.5" />
            </button>
          )}
        </div>

        {/* Tag Filters (compact horizontal scroll) */}
        {globalTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 -mx-4 px-4 scrollbar-none">
            <button
              onClick={() => clearFilters()}
              className={cn(
                "px-3 py-1 rounded-md text-xs font-semibold transition-all active:scale-95 flex-shrink-0 border",
                selectedTags.length === 0 
                  ? "bg-primary text-primary-foreground border-primary" 
                  : "bg-secondary/35 text-muted-foreground/90 border-transparent hover:bg-secondary/60"
              )}
            >
              All
            </button>
            {globalTags.map(tag => {
              const isActive = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => handleTagAction(tag)}
                  className={cn(
                    "px-3 py-1 rounded-md text-xs font-semibold transition-all active:scale-95 flex-shrink-0 border",
                    isActive 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "bg-secondary/35 text-muted-foreground/90 border-transparent hover:bg-secondary/60"
                  )}
                >
                  #{tag}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* Archive List */}
      <main className="space-y-1">
        {filteredItems.length === 0 ? (
          <div className="text-center py-12 space-y-1">
            <p className="text-sm font-semibold text-muted-foreground">No items found</p>
            <p className="text-xs text-muted-foreground/60">
              {items && items.length === 0 
                ? "Your personal archive is empty. Add your first item." 
                : "Try adjusting your search query or tags."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredItems.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
