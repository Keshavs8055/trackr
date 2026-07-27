"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAppStore } from "@/store/app-store";
import { useFilterStore } from "@/store/filter-store";
import { useUserTags } from "@/hooks/use-resources";
import { RESOURCE_TYPES, PROVIDERS } from "@/types";
import { X, SlidersHorizontal, RotateCcw, Check, Calendar, Tag, ShieldCheck, Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const STATUS_OPTIONS = [
  "backlog",
  "planned",
  "in-progress",
  "completed",
  "abandoned"
];

const PROVIDER_OPTIONS = [
  { id: PROVIDERS.MANUAL, name: "Manual Entry" },
  { id: PROVIDERS.OMDB, name: "OMDb API" },
  { id: PROVIDERS.OPENLIBRARY, name: "Open Library" },
  { id: PROVIDERS.TMDB, name: "TMDb API" },
  { id: PROVIDERS.GOOGLE_BOOKS, name: "Google Books" }
];

export function AdvancedFilterDrawer() {
  const { filterDrawerOpen, setFilterDrawerOpen } = useAppStore();
  const filterStore = useFilterStore();
  const availableTags = useUserTags();

  // Local state to hold edits before applying
  const [localTypes, setLocalTypes] = useState<string[]>([]);
  const [localProviders, setLocalProviders] = useState<string[]>([]);
  const [localStatuses, setLocalStatuses] = useState<string[]>([]);
  const [localTags, setLocalTags] = useState<string[]>([]);
  const [localMinYear, setLocalMinYear] = useState<string>("");
  const [localMaxYear, setLocalMaxYear] = useState<string>("");

  // Sync local state when drawer opens
  useEffect(() => {
    if (filterDrawerOpen) {
      setLocalTypes(filterStore.selectedTypes);
      setLocalProviders(filterStore.selectedProviders);
      setLocalStatuses(filterStore.selectedStatuses);
      setLocalTags(filterStore.selectedTags);
      setLocalMinYear(filterStore.minYear ? String(filterStore.minYear) : "");
      setLocalMaxYear(filterStore.maxYear ? String(filterStore.maxYear) : "");
    }
  }, [filterDrawerOpen, filterStore]);

  const toggleLocalType = (type: string) => {
    setLocalTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleLocalProvider = (provider: string) => {
    setLocalProviders(prev =>
      prev.includes(provider) ? prev.filter(p => p !== provider) : [...prev, provider]
    );
  };

  const toggleLocalStatus = (status: string) => {
    setLocalStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const toggleLocalTag = (tag: string) => {
    setLocalTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleClearAll = () => {
    setLocalTypes([]);
    setLocalProviders([]);
    setLocalStatuses([]);
    setLocalTags([]);
    setLocalMinYear("");
    setLocalMaxYear("");
  };

  const handleApply = () => {
    filterStore.setSelectedTypes(localTypes);
    filterStore.setSelectedProviders(localProviders);
    filterStore.setSelectedStatuses(localStatuses);
    filterStore.setSelectedTags(localTags);
    
    const minYearNum = localMinYear.trim() ? parseInt(localMinYear, 10) : null;
    const maxYearNum = localMaxYear.trim() ? parseInt(localMaxYear, 10) : null;
    filterStore.setMinYear(isNaN(minYearNum as any) ? null : minYearNum);
    filterStore.setMaxYear(isNaN(maxYearNum as any) ? null : maxYearNum);

    setFilterDrawerOpen(false);
  };

  // Compute active filter counts
  const activeCount = 
    localTypes.length + 
    localProviders.length + 
    localStatuses.length + 
    localTags.length + 
    (localMinYear.trim() ? 1 : 0) + 
    (localMaxYear.trim() ? 1 : 0);

  return (
    <AnimatePresence>
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 backdrop-blur-xs md:items-center p-0 md:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
            onClick={() => setFilterDrawerOpen(false)}
          />

          <motion.div
            initial={{ y: "100%", opacity: 0.8 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0.8 }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="relative z-10 w-full max-w-lg bg-card rounded-t-2xl md:rounded-2xl border border-border shadow-lg flex flex-col max-h-[85vh] overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 flex items-center justify-between border-b border-border/30">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="size-4 text-primary" />
                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                  Advanced Filters
                </h2>
                {activeCount > 0 && (
                  <span className="ml-1.5 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
                    {activeCount} active
                  </span>
                )}
              </div>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-full hover:bg-secondary active:scale-95 transition-all"
                aria-label="Close"
              >
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 overflow-y-auto space-y-6 flex-1 text-sm">
              
              {/* Resource Types Section */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Bookmark className="size-3" /> Resource Type
                </h3>
                <div className="flex flex-wrap gap-2">
                  {Object.values(RESOURCE_TYPES).map(type => {
                    const isSelected = localTypes.includes(type);
                    return (
                      <button
                        key={type}
                        onClick={() => toggleLocalType(type)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 capitalize",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Section */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <ShieldCheck className="size-3" /> Lifecycle Status
                </h3>
                <div className="flex flex-wrap gap-2">
                  {STATUS_OPTIONS.map(status => {
                    const isSelected = localStatuses.includes(status);
                    return (
                      <button
                        key={status}
                        onClick={() => toggleLocalStatus(status)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95 capitalize",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        )}
                      >
                        {status.replace("-", " ")}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Providers Section */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <SlidersHorizontal className="size-3" /> Metadata Provider
                </h3>
                <div className="flex flex-wrap gap-2">
                  {PROVIDER_OPTIONS.map(provider => {
                    const isSelected = localProviders.includes(provider.id);
                    return (
                      <button
                        key={provider.id}
                        onClick={() => toggleLocalProvider(provider.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all active:scale-95",
                          isSelected
                            ? "bg-primary text-primary-foreground border-primary shadow-sm"
                            : "bg-secondary/40 border-border/40 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                        )}
                      >
                        {provider.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Publication / Release Year Section */}
              <div className="space-y-2.5">
                <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                  <Calendar className="size-3" /> Publication / Release Year
                </h3>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={localMinYear}
                    onChange={(e) => setLocalMinYear(e.target.value)}
                    placeholder="Min Year (e.g. 1990)"
                    className="w-full h-10 px-3 rounded-lg bg-secondary/35 border border-border/40 outline-none text-xs focus:border-primary/40 focus:ring-0 transition-all font-medium"
                  />
                  <span className="text-muted-foreground text-xs font-medium">to</span>
                  <input
                    type="number"
                    value={localMaxYear}
                    onChange={(e) => setLocalMaxYear(e.target.value)}
                    placeholder="Max Year (e.g. 2026)"
                    className="w-full h-10 px-3 rounded-lg bg-secondary/35 border border-border/40 outline-none text-xs focus:border-primary/40 focus:ring-0 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Tag Cloud Section */}
              {availableTags.length > 0 && (
                <div className="space-y-2.5">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <Tag className="size-3" /> Tag Cloud
                  </h3>
                  <div className="flex flex-wrap gap-2 max-h-36 overflow-y-auto p-1 border border-border/20 rounded-lg bg-secondary/10">
                    {availableTags.map(tag => {
                      const isSelected = localTags.includes(tag);
                      return (
                        <button
                          key={tag}
                          onClick={() => toggleLocalTag(tag)}
                          className={cn(
                            "px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-all active:scale-95",
                            isSelected
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-secondary/40 border-border/30 text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                          )}
                        >
                          #{tag}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>

            {/* Footer Actions */}
            <div className="p-4 bg-secondary/15 border-t border-border/30 flex gap-3">
              <Button
                variant="outline"
                onClick={handleClearAll}
                className="flex-1 h-10 text-xs font-semibold gap-1.5"
              >
                <RotateCcw className="size-3.5" />
                Clear All
              </Button>
              <Button
                onClick={handleApply}
                className="flex-1 h-10 text-xs font-semibold gap-1.5"
              >
                <Check className="size-3.5" />
                Apply Filters
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
