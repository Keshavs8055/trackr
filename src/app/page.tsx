"use client";

import { useItems, useUserTags, useFacetedTags } from "@/hooks/use-items";
import { ItemCard } from "@/components/item-card";
import { useFilterStore } from "@/store/filter-store";
import { useTagAction } from "@/hooks/use-tag-action";
import { useAppStore } from "@/store/app-store";
import { Search, X, WifiOff, RefreshCw } from "lucide-react";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import React, { useDeferredValue, useRef, useEffect, useMemo, useState, useCallback } from "react";
import { ItemDetails } from "@/components/item-details";
import { Item } from "@/types";

export default function Home() {
  const { data: items, isLoading } = useItems();
  const { searchQuery, setSearchQuery, selectedTags, toggleTag, clearFilters } = useFilterStore();
  const globalTags = useFacetedTags(selectedTags);
  
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const handleTagAction = useTagAction();

  const { searchFocused, setSearchFocused } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedItem, setSelectedItem] = useState<Item | null>(null);

  const handleOpenDetails = useCallback((item: Item) => {
    setSelectedItem(item);
  }, []);

  // Intercept changes to search query to automatically extract matching hashtags
  const handleSearchChange = (val: string) => {
    let newVal = val;
    let tagsToToggle: string[] = [];

    // Parse the input for words starting with #
    const words = val.split(/(\s+)/);
    const updatedWords = words.map(word => {
      if (word.startsWith("#") && word.length > 1) {
        const cleanTag = word.slice(1).toLowerCase();
        if (globalTags.includes(cleanTag)) {
          tagsToToggle.push(cleanTag);
          return "";
        }
      }
      return word;
    });

    if (tagsToToggle.length > 0) {
      tagsToToggle.forEach(tag => {
        if (!selectedTags.includes(tag)) {
          toggleTag(tag);
        }
      });
      // Clean up spaces left by removed hashtags
      newVal = updatedWords.join("").replace(/\s+/g, ' ').trim();
    }
    
    setSearchQuery(newVal);
  };

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
        {/* Mobile App Bar */}
        <div className="flex md:hidden items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-2">
            <Logo className="size-5 text-foreground" />
            <span className="text-sm font-bold tracking-tight">Trackr</span>
          </div>
          <ConnectionStatus />
        </div>

        {/* Search Field */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
          <input 
            ref={searchInputRef}
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
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
              <ItemCard key={item.id} item={item} index={i} onOpenDetails={handleOpenDetails} />
            ))}
          </div>
        )}
      </main>

      {/* Shared lifted details modal */}
      <ItemDetails 
        item={selectedItem} 
        isOpen={!!selectedItem} 
        onClose={() => setSelectedItem(null)} 
      />
    </div>
  );
}

function ConnectionStatus() {
  const isOnline = useAppStore(s => s.isOnline);
  const hasPendingWrites = useAppStore(s => s.hasPendingWrites);

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 text-[9px] font-bold animate-pulse flex-shrink-0">
        <WifiOff className="size-2.5" />
        <span>Offline</span>
      </div>
    );
  }

  if (hasPendingWrites) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20 text-[9px] font-bold flex-shrink-0">
        <RefreshCw className="size-2.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  return null;
}
