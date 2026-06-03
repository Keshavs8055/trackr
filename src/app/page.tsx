"use client";

import { useItems, useUserTags } from "@/hooks/use-items";
import { ItemCard } from "@/components/item-card";
import { useFilterStore } from "@/store/filter-store";
import { useTagAction } from "@/hooks/use-tag-action";
import { Search, X } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { LoadingState } from "@/components/ui/loading-state";
import { cn } from "@/lib/utils";
import React, { useDeferredValue } from "react";

export default function Home() {
  const { data: items, isLoading } = useItems();
  const globalTags = useUserTags();
  
  const { searchQuery, setSearchQuery, selectedTags, clearFilters } = useFilterStore();
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const handleTagAction = useTagAction();

  const filteredItems = React.useMemo(() => {
    if (!items) return [];
    return items.filter(item => {
      const matchesSearch = !deferredSearchQuery || item.title.toLowerCase().includes(deferredSearchQuery.toLowerCase());
      const matchesTags = selectedTags.length === 0 || selectedTags.every(t => item.tags?.includes(t));
      return matchesSearch && matchesTags;
    });
  }, [items, deferredSearchQuery, selectedTags]);

  return (
    <div className="space-y-8 pb-24 md:pb-12">
      <header className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Your Archive</h1>
          <p className="text-muted-foreground mt-1">A personal space for your tagged memories.</p>
        </div>

        {/* Global Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search memories..." 
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

          {/* Quick Tag Clusters */}
          {globalTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {globalTags.map(tag => {
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

      {/* Main List */}
      <section>
        {isLoading ? (
          <LoadingState />
        ) : filteredItems.length === 0 ? (
          <EmptyState 
            title="No memories found." 
            description="Try adjusting your filters or search query." 
          />
        ) : (
          <div className="flex flex-col space-y-1">
            {filteredItems.map((item, i) => (
              <ItemCard key={item.id} item={item} index={i} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
