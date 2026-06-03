"use client";

import { useCollections, useItems } from "@/hooks/use-items";
import { ItemCard } from "@/components/item-card";
import { ArrowLeft, Search, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { useRouter } from "next/navigation";
import React, { use, useMemo, useDeferredValue } from "react";
import { Button } from "@/components/ui/button";
import { useFilterStore } from "@/store/filter-store";
import { useTagAction } from "@/hooks/use-tag-action";
import { cn } from "@/lib/utils";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  
  const { data: collections, isLoading: colLoading } = useCollections();
  const { data: items, isLoading: itemsLoading } = useItems();

  const { searchQuery, setSearchQuery, selectedTags, clearFilters } = useFilterStore();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const handleTagAction = useTagAction();

  const collection = collections?.find(c => c.id === resolvedParams.id);

  // 1. Get all items belonging to this collection
  const collectionItems = useMemo(() => {
    if (!items || !collection) return [];
    const normalizedTitle = collection.title.replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-');
    const tagMatches = items.filter(item => item.tags.includes(normalizedTitle));
    const explicitMatches = items.filter(item => collection.itemIds?.includes(item.id));
    return Array.from(new Set([...tagMatches, ...explicitMatches]));
  }, [items, collection]);

  // 2. Get all unique tags used within this collection
  const collectionTags = useMemo(() => {
    if (!collection) return [];
    const normalizedTitle = collection.title.replace(/^#/, '').trim().toLowerCase().replace(/\s+/g, '-');
    const tagSet = new Set<string>();
    
    collectionItems.forEach(item => {
      item.tags?.forEach(tag => {
        if (tag !== normalizedTitle) {
          tagSet.add(tag);
        }
      });
    });
    return Array.from(tagSet).sort();
  }, [collectionItems, collection]);

  // 3. Apply search and selected tags filter
  const filteredCollectionItems = useMemo(() => {
    return collectionItems.filter(item => {
      const matchesSearch = !deferredSearchQuery || item.title.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => item.tags?.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [collectionItems, deferredSearchQuery, selectedTags]);

  if (colLoading || itemsLoading) {
    return <LoadingState fullScreen />;
  }

  if (!collection) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <h2 className="text-2xl font-bold">Collection not found</h2>
        <Button variant="outline" onClick={() => router.push('/collections')}>Back to Collections</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <header className="space-y-6">
        <button 
          onClick={() => {
            clearFilters();
            router.back();
          }} 
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-4" /> Back
        </button>
        <div>
          <h1 className="text-4xl font-bold tracking-tight capitalize">{collection.title}</h1>
          {collection.description && (
            <p className="text-muted-foreground mt-2">{collection.description}</p>
          )}
        </div>

        {/* Local Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search in ${collection.title}...`} 
              className="w-full pl-12 pr-4 h-14 rounded-2xl bg-secondary/50 border-none outline-none text-lg focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-muted-foreground"
            />
            {(searchQuery || selectedTags.length > 0) && (
              <button 
                onClick={clearFilters}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            )}
          </div>

          {/* Local Quick Tag Clusters */}
          {collectionTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {collectionTags.map(tag => {
                const isActive = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleTagAction(tag)}
                    className={cn(
                      "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200",
                      isActive 
                        ? "bg-primary text-primary-foreground shadow-sm scale-105" 
                        : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
                    )}
                  >
                    #{tag}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      <section>
        {filteredCollectionItems.length === 0 ? (
          <EmptyState 
            title={collectionItems.length === 0 ? "No items in this collection yet." : "No matches found."}
            description={collectionItems.length !== 0 ? "Try adjusting your filters or search query." : undefined}
          />
        ) : (
          <div className="flex flex-col space-y-2">
            {filteredCollectionItems.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
