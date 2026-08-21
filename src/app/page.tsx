"use client";

import dynamic from "next/dynamic";
import { useResources, useFacetedTags } from "@/hooks/use-resources";
import { ResourceCard } from "@/components/resource-card";
import { ResourceDetails } from "@/components/resource-details";
import { ResourceSkeleton } from "@/components/ui/resource-skeleton";
import { ResourceStatsBar } from "@/components/resources/resource-stats-bar";
import { SavedSearchesBar } from "@/components/search/saved-searches-bar";
import { useFilterStore } from "@/store/filter-store";
import { useTagAction } from "@/hooks/use-tag-action";
import { useAppStore } from "@/store/app-store";
import { Search, X, SlidersHorizontal, Settings, Option, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/logo";
import { ConnectionStatus } from "@/components/layout/connection-status";
import React, { useDeferredValue, useRef, useEffect, useMemo, useState, useCallback } from "react";
import { Resource } from "@/types";
import { normalizeTag, getStatusSynonymTags } from "@/lib/parser";

import { useCollections } from "@/hooks/use-collections";
import { CollectionGrid } from "@/components/collections/collection-grid";
import { CollectionDetailView } from "@/components/collections/collection-detail-view";
import { VirtualizedResourceFeed } from "@/components/resources/virtualized-resource-feed";
import { Collection } from "@/types";


const IntegrationsDrawer = dynamic(() => import("@/components/integrations-drawer").then(mod => mod.IntegrationsDrawer), { ssr: false });
const AdvancedFilterDrawer = dynamic(() => import("@/components/search/advanced-filter-drawer").then(mod => mod.AdvancedFilterDrawer), { ssr: false });
const CollectionBuilderModal = dynamic(() => import("@/components/collections/collection-builder-modal").then(mod => mod.CollectionBuilderModal), { ssr: false });
const AICommandModal = dynamic(() => import("@/components/ai/ai-command-modal").then(mod => mod.AICommandModal), { ssr: false });


export default function Home() {
  const { data: resources, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useResources();
  const { data: collections } = useCollections();
  
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null);
  const [isCollectionModalOpen, setIsCollectionModalOpen] = useState(false);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<Collection | null>(null);

  
  const { 
    searchQuery, 
    setSearchQuery, 
    selectedTags, 
    toggleTag, 
    clearFilters,
    selectedTypes,
    selectedProviders,
    selectedStatuses,
    minYear,
    maxYear 
  } = useFilterStore();
  
  const globalTags = useFacetedTags(selectedTags);
  
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const handleTagAction = useTagAction();

  const { searchFocused, setSearchFocused, setIntegrationsOpen, setFilterDrawerOpen } = useAppStore();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);

  const handleOpenDetails = useCallback((resource: Resource) => {
    setSelectedResource(resource);
  }, []);

  const handleSearchChange = (val: string) => {
    let newVal = val;
    let tagsToToggle: string[] = [];

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
      newVal = updatedWords.join("").replace(/\s+/g, ' ').trim();
    }
    
    setSearchQuery(newVal);
  };

  useEffect(() => {
    if (searchFocused && searchInputRef.current) {
      searchInputRef.current.focus();
      setSearchFocused(false);
    }
  }, [searchFocused, setSearchFocused]);

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter(resource => {
      // 1. Search Query
      const matchesSearch = !deferredSearchQuery || 
        (typeof resource.title === 'string' && resource.title.toLowerCase().includes(deferredSearchQuery.toLowerCase())) ||
        resource.tags?.some(tag => typeof tag === 'string' && tag.toLowerCase().includes(deferredSearchQuery.toLowerCase())) ||
        (typeof resource.notes === 'string' && resource.notes.toLowerCase().includes(deferredSearchQuery.toLowerCase())) ||
        (typeof resource.url === 'string' && resource.url.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
      
      // 2. Tags (with status tag synonym matching)
      const matchesTags = selectedTags.length === 0 || selectedTags.every(selectedTag => {
        const normSelected = normalizeTag(selectedTag);
        const hasDirectTag = resource.tags?.some(resourceTag => {
          const normResource = normalizeTag(resourceTag);
          return normResource === normSelected;
        });
        if (hasDirectTag) return true;
        const statusSynonyms = getStatusSynonymTags(resource.status);
        return statusSynonyms.some(syn => normalizeTag(syn) === normSelected);
      });

      // 3. Types
      const matchesTypes = selectedTypes.length === 0 || selectedTypes.includes(resource.type);

      // 4. Providers
      const provider = resource.providerMetadata?.provider || resource.provider || 'manual';
      const matchesProviders = selectedProviders.length === 0 || selectedProviders.includes(provider);

      // 5. Statuses
      const status = (resource.status || 'backlog').toLowerCase();
      const matchesStatuses = selectedStatuses.length === 0 || selectedStatuses.some((selected) => {
        const normSel = selected.toLowerCase();
        if (normSel === 'in-progress' || normSel === 'in_progress') {
          return status === 'in_progress' || status === 'in-progress' || status === 'watching' || status === 'reading';
        }
        if (normSel === 'planned') {
          return status === 'planned' || status === 'plan_to_watch' || status === 'plan_to_read';
        }
        if (normSel === 'dropped' || normSel === 'abandoned') {
          return status === 'dropped' || status === 'abandoned' || status === 'archived';
        }
        if (normSel === 'completed') {
          return status === 'completed' || status === 'watched' || status === 'read';
        }
        return status === normSel;
      });

      // 6. Year Range
      let matchesYear = true;
      const meta = resource.providerMetadata?.metadata || resource.metadata || {};
      const yearRaw = meta.year || meta.publishYear || meta.releaseYear;
      if (yearRaw && (minYear !== null || maxYear !== null)) {
        const year = parseInt(String(yearRaw).replace(/\D/g, ''), 10);
        if (!isNaN(year)) {
          if (minYear !== null && year < minYear) matchesYear = false;
          if (maxYear !== null && year > maxYear) matchesYear = false;
        } else {
          matchesYear = false;
        }
      } else if (minYear !== null || maxYear !== null) {
        matchesYear = false;
      }

      return matchesSearch && matchesTags && matchesTypes && matchesProviders && matchesStatuses && matchesYear;
    });
  }, [
    resources, 
    deferredSearchQuery, 
    selectedTags,
    selectedTypes,
    selectedProviders,
    selectedStatuses,
    minYear,
    maxYear
  ]);

  const activeFilterCount = 
    selectedTags.length + 
    selectedTypes.length + 
    selectedProviders.length + 
    selectedStatuses.length + 
    (minYear !== null ? 1 : 0) + 
    (maxYear !== null ? 1 : 0);

  const hasActiveFilters = searchQuery.trim().length > 0 || activeFilterCount > 0;

  // Automatically fetch subsequent pages if active filters yield few results while more pages exist
  useEffect(() => {
    if (hasActiveFilters && filteredResources.length < 5 && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasActiveFilters, filteredResources.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return <ResourceSkeleton />;
  }

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-2xl mx-auto">
      {/* Sticky Header: Minimal Search & Tag Filters */}
      <header className="sticky top-0 z-30 bg-background/95 backdrop-blur-md -mx-4 px-4 -mt-4 pt-6 pb-4 md:-mx-8 md:px-8 md:-mt-8 md:pt-10 border-b border-border/30 space-y-3.5">
        {/* Mobile App Bar */}
        <div className="flex md:hidden items-center justify-between py-1 px-0.5">
          <div className="flex items-center gap-2">
            <Logo className="size-5 text-foreground" />
            <span className="text-sm font-bold tracking-tight">Trackr</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIntegrationsOpen(true)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              aria-label="Integrations Settings"
              title="Integrations"
            >
              <Settings className="size-4" />
            </button>
            <ConnectionStatus />
          </div>
        </div>

        {/* Search Field */}
        <div className="relative flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground/50" />
            <input 
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search resources or #tags..." 
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
          
          <button
            onClick={() => setIsAIModalOpen(true)}
            className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300 transition-all flex-shrink-0"
            title="AI Assistant (Cmd+Shift+K)"
          >
            <Sparkles className="size-3.5 text-purple-400" />
            <span className="hidden sm:inline">Ask AI</span>
          </button>

          <button
            onClick={() => setFilterDrawerOpen(true)}
            className="flex items-center gap-1.5 px-3 h-10 rounded-lg bg-secondary/35 hover:bg-secondary/60 border border-border/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
            title="Advanced Filters"
          >
            <SlidersHorizontal className="size-3.5" />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span className="flex items-center justify-center size-4 rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setIntegrationsOpen(true)}
            className="hidden md:flex items-center gap-1.5 px-2.5 h-10 rounded-lg bg-secondary/35 hover:bg-secondary/60 border border-border/40 text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex-shrink-0"
            title="Providers & Integrations"
          >
            <Settings className="size-3.5" />
            <span>Providers</span>
          </button>
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
            {globalTags.map((tag, idx) => {
              const isActive = selectedTags.includes(tag);
              return (
                <button
                  key={`global-tag-${tag}-${idx}`}
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

      {/* Resource List / Collections Section */}
      <div className="space-y-4">
        <div className={cn(searchQuery ? "hidden md:block" : "block")}>
          <ResourceStatsBar resources={resources || []} />
        </div>
        <SavedSearchesBar />

        {selectedCollection ? (
          <CollectionDetailView
            collection={selectedCollection}
            resources={resources || []}
            onBack={() => setSelectedCollection(null)}
            onOpenEditModal={(col) => {
              setEditingCollection(col);
              setIsCollectionModalOpen(true);
            }}
            onOpenResourceDetails={handleOpenDetails}
          />
        ) : (
          <>
            {/* Collections Grid Overview */}
            {collections && collections.length > 0 && (
              <div className="space-y-2 ">
                <div className="flex items-center justify-between ">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Collections</span>
                  <button
                    onClick={() => {
                      setEditingCollection(null);
                      setIsCollectionModalOpen(true);
                    }}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    + New Collection
                  </button>
                </div>
                <CollectionGrid
                  collections={collections}
                  resources={resources || []}
                  onSelectCollection={(col) => setSelectedCollection(col)}
                  onOpenCreateModal={() => {
                    setEditingCollection(null);
                    setIsCollectionModalOpen(true);
                  }}
                />
              </div>
            )}

            <VirtualizedResourceFeed
              resources={filteredResources}
              onSelectResource={(res) => handleOpenDetails(res)}
              onLoadMore={() => fetchNextPage()}
              hasMore={!!hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
            />
          </>
        )}
      </div>

      {/* Collection Builder / Editor Modal */}
      <CollectionBuilderModal
        isOpen={isCollectionModalOpen}
        onClose={() => {
          setIsCollectionModalOpen(false);
          setEditingCollection(null);
        }}
        collection={editingCollection}
        availableResources={resources || []}
      />

      {/* Shared details modal */}
      <ResourceDetails 
        resource={selectedResource} 
        isOpen={!!selectedResource} 
        onClose={() => setSelectedResource(null)} 
      />

      {/* Integrations Drawer */}
      <IntegrationsDrawer />

      {/* Advanced Filter Drawer */}
      <AdvancedFilterDrawer />

      {/* AI Command Modal */}
      <AICommandModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        allResources={resources || []}
        onSelectResource={(res) => handleOpenDetails(res)}
      />
    </div>
  );
}
